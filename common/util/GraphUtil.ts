export class GraphUtil {
  public static graphFromNodesAndEdges(nodes: { id: string }[], edges: { source: string, target: string }[]): string {
    const INDENT = ' '.repeat(2);
    let nodeString = '';
    let edgeString = '';
    for(const node of nodes) {
      nodeString += `${INDENT}node\n${INDENT}[\n${INDENT}${INDENT}id "${node.id}"\n${INDENT}${INDENT}label "${node.id}"\n${INDENT}]\n`;
    }
    for(const edge of edges) {
      edgeString += `${INDENT}edge\n${INDENT}[\n${INDENT}${INDENT}source "${edge.source}"\n${INDENT}${INDENT}target "${edge.target}"\n${INDENT}]\n`;
    }
    return `graph\n[\n${INDENT}directed 1\n${nodeString}${edgeString}]`;
  }
}
