"""Run in Blender with assets/models/sheep_barn_game.blend open after editing the barn."""

import bpy
import json
from pathlib import Path


def export():
    project = Path(bpy.data.filepath).resolve().parents[2]
    assert (project / "dist").is_dir(), "Open the barn blend from this project first"
    obj = bpy.data.objects["SheepBarn_Game"]
    mesh = obj.data
    vertices = []
    for vertex in mesh.vertices:
        x, y, z = obj.matrix_world @ vertex.co
        # Fit the model to the game's 20 x 18 barn footprint; z=0 is the front door.
        vertices.append([round((x + 1.5) * 1.2, 4), round((y + 3.112) * 0.82, 4), round(z * 0.82, 4)])
    materials = []
    for material in mesh.materials:
        shader = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
        materials.append([round(float(value), 4) for value in shader.inputs["Base Color"].default_value[:3]])
    faces = [[list(face.vertices), face.material_index] for face in mesh.polygons]
    output = project / "dist/assets/models/sheep-barn-mesh.json"
    output.write_text(json.dumps({"vertices": vertices, "faces": faces, "materials": materials}, separators=(",", ":")), encoding="utf-8")
    print(f"Exported {len(faces)} barn faces to {output}")


if __name__ == "__main__":
    export()
