import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type {McpTool, McpToolCallResult} from './mcp-client';
import type {AdditionalMcpServer} from './configuration';
import {VERSION, TOOLKIT_HEADER} from './constants';

interface ConnectedServer {
  name: string;
  url: string;
  client: Client;
  transport: StreamableHTTPClientTransport;
  toolNames: Set<string>;
}

/**
 * Manages connections to additional MCP servers and routes tool calls
 * to the server that owns each tool.
 *
 * This client complements the primary StripeMcpClient by enabling
 * tools from external providers (e.g. batch payment infrastructure)
 * to be surfaced alongside the core Stripe tools.
 */
export class MultiMcpClient {
  private servers: ConnectedServer[] = [];
  private toolToServer: Map<string, ConnectedServer> = new Map();
  private allTools: McpTool[] = [];

  /**
   * Connect to all additional MCP servers and collect their tools.
   */
  async connect(serverConfigs: AdditionalMcpServer[]): Promise<void> {
    const results = await Promise.allSettled(
      serverConfigs.map((config) => this.connectServer(config))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        console.warn(
          `[Stripe Agent Toolkit] Failed to connect to additional MCP server "${serverConfigs[i].name}" ` +
            `at ${serverConfigs[i].url}: ${result.reason}`
        );
      }
    }
  }

  private async connectServer(config: AdditionalMcpServer): Promise<void> {
    const headers: Record<string, string> = {
      'User-Agent': `${TOOLKIT_HEADER}/${VERSION}`,
      ...config.headers,
    };

    const transport = new StreamableHTTPClientTransport(new URL(config.url), {
      requestInit: {headers},
    });

    const client = new Client(
      {
        name: `${TOOLKIT_HEADER}-additional`,
        version: VERSION,
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    const result = await client.listTools();
    const tools = result.tools as McpTool[];

    const server: ConnectedServer = {
      name: config.name,
      url: config.url,
      client,
      transport,
      toolNames: new Set(tools.map((t) => t.name)),
    };

    this.servers.push(server);

    for (const tool of tools) {
      this.toolToServer.set(tool.name, server);
      this.allTools.push(tool);
    }
  }

  /**
   * Returns all tools from all connected additional servers.
   */
  getTools(): McpTool[] {
    return this.allTools;
  }

  /**
   * Check if this client owns a tool by name.
   */
  hasTool(name: string): boolean {
    return this.toolToServer.has(name);
  }

  /**
   * Call a tool, routing to the server that provides it.
   */
  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const server = this.toolToServer.get(name);
    if (!server) {
      throw new Error(
        `Tool "${name}" not found in any additional MCP server.`
      );
    }

    try {
      const result = (await server.client.callTool({
        name,
        arguments: args,
      })) as McpToolCallResult;

      if (result.isError) {
        const errorText = result.content?.find((c) => c.type === 'text')?.text;
        throw new Error(errorText || `Tool execution failed on ${server.name}`);
      }

      const textContent = result.content?.find((c) => c.type === 'text');
      if (textContent && textContent.text) {
        return textContent.text;
      }

      return JSON.stringify(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to execute tool "${name}" on ${server.name}: ${errorMessage}`,
        {cause: error}
      );
    }
  }

  /**
   * Disconnect all additional MCP servers.
   */
  async disconnect(): Promise<void> {
    await Promise.allSettled(
      this.servers.map(async (server) => {
        try {
          await server.client.close();
        } catch {
          // Ignore close errors
        }
      })
    );

    this.servers = [];
    this.toolToServer.clear();
    this.allTools = [];
  }
}

export default MultiMcpClient;
