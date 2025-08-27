import sqlite3, os, json, argparse

def xyz_to_tms(z, y):
    return (2**z - 1) - y

def pack_quantized_mesh(input_folder, output_file, dataset_name):
    if os.path.exists(output_file):
        os.remove(output_file)

    conn = sqlite3.connect(output_file)
    cur = conn.cursor()

    # Create schema
    cur.executescript("""
    CREATE TABLE tiles (zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, tile_data BLOB);
    CREATE TABLE metadata (name TEXT, value TEXT);
    CREATE UNIQUE INDEX tile_index ON tiles (zoom_level, tile_column, tile_row);
    """)

    # To create "available" ranges
    ranges = {}

    # Walk input folder
    for z in os.listdir(input_folder):
        z_path = os.path.join(input_folder, z)
        if not os.path.isdir(z_path):
            continue
        z = int(z)

        for x in os.listdir(z_path):
            x_path = os.path.join(z_path, x)
            if not os.path.isdir(x_path):
                continue
            x = int(x)

            for f in os.listdir(x_path):
                if not f.endswith(".terrain"):
                    continue
                y = int(f.replace(".terrain", ""))
                tms_y = xyz_to_tms(z, y)

                with open(os.path.join(x_path, f), "rb") as tile:
                    blob = tile.read()

                cur.execute("INSERT INTO tiles VALUES (?,?,?,?)",
                            (z, x, tms_y, sqlite3.Binary(blob)))

                if z not in ranges:
                    ranges[z] = {
                        "minX": x, "maxX": x,
                        "minY": y, "maxY": y
                    }
                else:
                    r = ranges[z]
                    r["minX"] = min(r["minX"], x)
                    r["maxX"] = max(r["maxX"], x)
                    r["minY"] = min(r["minY"], y)
                    r["maxY"] = max(r["maxY"], y)

    available = []
    for z in sorted(ranges.keys()):
        r = ranges[z]
        available.append([{
            "startX": r["minX"],
            "startY": r["minY"],
            "endX": r["maxX"],
            "endY": r["maxY"]
        }])

    cur.execute("INSERT INTO metadata (name,value) VALUES (?,?)",
                ("json", json.dumps({ "extensions": ["octvertexnormals"], "available": available }, separators=(',', ':'))))

    # Add minimal metadata
    metadata = {
        "name": dataset_name,
        "format": "quantized-mesh-1.0",
        "minzoom": str(min(ranges.keys())),
        "maxzoom": str(max(ranges.keys())),
        "bounds": "-180.0,-90.0,180.0,90.0",
        "projection": "EPSG:4326",
        "schema": "tms"
    }
    for k, v in metadata.items():
        cur.execute("INSERT INTO metadata (name,value) VALUES (?,?)", (k, v))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pack Quantized Mesh tiles into MBTiles format.")
    parser.add_argument("input_folder", help="Path to the input folder containing quantized-mesh tiles")
    parser.add_argument("output_file", help="Output .mbtiles file path")
    parser.add_argument("--name", "-n", help="Dataset name to store in metadata", default="Quantized Mesh Terrain")
    args = parser.parse_args()

    pack_quantized_mesh(args.input_folder, args.output_file, args.name)