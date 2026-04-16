#!/bin/bash
# Muestra procesos que más RAM y CPU usan (Cursor, Node, Chrome, etc.)
# Para identificar qué está consumiendo recursos en el equipo.

echo "📊 Procesos por uso de memoria (RAM) — top 15"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ps -A -o rss,pid,command 2>/dev/null | sort -k1 -rn | head -16 | awk 'NR==1 {print "  RSS(MB)  PID  Comando"; next} {r=int($1/1024); if(r>0) printf "  %6s   %s   %s\n", r"MB", $2, substr($0, index($0,$3))}'

echo ""
echo "📊 Procesos por uso de CPU — top 10"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ps -A -o pcpu,pid,command 2>/dev/null | sort -k1 -rn | head -11 | awk 'NR==1 {print "  %CPU   PID  Comando"; next} {printf "  %4s   %s   %s\n", $1"%", $2, substr($0, index($0,$3))}'

echo ""
echo "💡 Cursor, Node y Chrome suelen ser los que más consumen."
echo "   Cierra pestañas, desactiva extensiones o cierra otras apps para liberar."
