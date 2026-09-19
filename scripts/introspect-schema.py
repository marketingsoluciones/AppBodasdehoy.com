import json, os, subprocess, sys

MCP_GRAPHQL_URL = os.getenv('API_MCP_GRAPHQL_URL') or os.getenv('NEXT_PUBLIC_API_MCP_GRAPHQL_URL')
if not MCP_GRAPHQL_URL:
    raise SystemExit('Missing API_MCP_GRAPHQL_URL')

def fetch_type(name):
    query = f'{{ __type(name:"{name}") {{ name fields {{ name type {{ name kind ofType {{ name kind ofType {{ name kind }} }} }} }} }} }}'
    r = subprocess.run(['curl', '-s', '--max-time', '10',
        MCP_GRAPHQL_URL,
        '-X', 'POST', '-H', 'Content-Type: application/json',
        '-d', json.dumps({'query': query})], capture_output=True, text=True)
    return json.loads(r.stdout)

def resolve_type(t, indent=0):
    prefix = '  ' * indent
    if not t:
        return f"{prefix}???"
    name = t.get('name', '')
    kind = t.get('kind', '')
    oftype = t.get('ofType')
    if kind == 'NON_NULL' and oftype:
        return resolve_type(oftype, indent) + '!'
    if kind == 'LIST' and oftype:
        return '[' + resolve_type(oftype, indent) + ']'
    if name:
        return name
    return kind

for type_name in ['EventoInvitado', 'EventoMenu', 'MenuSeleccion', 'Comunicacion', 'Evento']:
    d = fetch_type(type_name)
    t = d.get('data', {}).get('__type')
    if not t:
        print(f"\n=== {type_name}: ERROR {json.dumps(d)[:200]}")
        continue
    print(f"\n=== {type_name} ===")
    for f in (t.get('fields') or []):
        tname = resolve_type(f.get('type', {}))
        print(f"  {f['name']}: {tname}")
