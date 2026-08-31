from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
sys.path.insert(0, str(SRC))

from graph_builder import build_graph, save_graph  # noqa: E402


def main() -> None:
    artifacts = build_graph()
    save_graph(artifacts)
    print("Graph built and saved.")
    print(f"Nodes: {artifacts.graph.number_of_nodes()}")
    print(f"Edges: {artifacts.graph.number_of_edges()}")
    print(f"Metadata: {artifacts.metadata}")


if __name__ == "__main__":
    main()
