#!/usr/bin/env node
/**
 * Script para trabajar con las 1000 preguntas del backend
 * 
 * Uso:
 *   node scripts/trabajar-con-1000-preguntas.mjs [comando] [opciones]
 * 
 * Comandos:
 *   listar          - Listar todas las preguntas
 *   buscar <texto>  - Buscar preguntas por texto
 *   categoria <cat> - Filtrar por categoría
 *   dificultad <d>  - Filtrar por dificultad (easy/medium/hard)
 *   exportar        - Exportar preguntas a JSON
 *   test <n>        - Ejecutar tests con n preguntas
 *   estadisticas    - Mostrar estadísticas de las preguntas
 */

// Usar fetch nativo de Node.js 18+ (no necesita import)

const BACKEND_URL = process.env.BACKEND_URL || 'https://api-ia.bodasdehoy.com';
const DEVELOPMENT = process.env.DEVELOPMENT || 'bodasdehoy';

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Obtener preguntas del backend
 */
async function getQuestions(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);

    const url = `${BACKEND_URL}/api/admin/tests/questions${params.toString() ? `?${params.toString()}` : ''}`;
    
    log(`\n🔄 Obteniendo preguntas desde: ${url}`, 'cyan');
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Development': DEVELOPMENT,
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log(`❌ Error obteniendo preguntas: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Listar preguntas
 */
async function listarPreguntas(filters = {}) {
  const questions = await getQuestions(filters);
  
  log(`\n📋 Total de preguntas encontradas: ${questions.length}`, 'green');
  log('─'.repeat(80), 'cyan');
  
  questions.forEach((q, index) => {
    log(`\n${index + 1}. [${q.category || 'N/A'}] [${q.difficulty || 'N/A'}]`, 'yellow');
    log(`   Pregunta: ${q.question}`, 'bright');
    if (q.keywords && q.keywords.length > 0) {
      log(`   Keywords: ${q.keywords.join(', ')}`, 'blue');
    }
    if (q.expectedResponse) {
      log(`   Respuesta esperada: ${q.expectedResponse.substring(0, 100)}...`, 'cyan');
    }
  });
  
  return questions;
}

/**
 * Buscar preguntas por texto
 */
async function buscarPreguntas(texto) {
  log(`\n🔍 Buscando preguntas que contengan: "${texto}"`, 'cyan');
  const questions = await getQuestions({ search: texto });
  
  if (questions.length === 0) {
    log('❌ No se encontraron preguntas', 'red');
    return;
  }
  
  await listarPreguntas({ search: texto });
}

/**
 * Filtrar por categoría
 */
async function filtrarPorCategoria(categoria) {
  log(`\n📁 Filtrando por categoría: ${categoria}`, 'cyan');
  await listarPreguntas({ category: categoria });
}

/**
 * Filtrar por dificultad
 */
async function filtrarPorDificultad(dificultad) {
  log(`\n⚡ Filtrando por dificultad: ${dificultad}`, 'cyan');
  await listarPreguntas({ difficulty: dificultad });
}

/**
 * Exportar preguntas a JSON
 */
async function exportarPreguntas() {
  log('\n💾 Exportando todas las preguntas...', 'cyan');
  const questions = await getQuestions();
  
  const filename = `preguntas-export-${new Date().toISOString().split('T')[0]}.json`;
  const fs = await import('fs/promises');
  
  await fs.writeFile(filename, JSON.stringify(questions, null, 2), 'utf-8');
  log(`✅ Exportadas ${questions.length} preguntas a: ${filename}`, 'green');
}

/**
 * Mostrar estadísticas
 */
async function mostrarEstadisticas() {
  log('\n📊 Calculando estadísticas...', 'cyan');
  const questions = await getQuestions();
  
  const stats = {
    total: questions.length,
    porCategoria: {},
    porDificultad: {},
    conKeywords: 0,
    conRespuestaEsperada: 0,
  };
  
  questions.forEach(q => {
    // Por categoría
    const cat = q.category || 'sin-categoria';
    stats.porCategoria[cat] = (stats.porCategoria[cat] || 0) + 1;
    
    // Por dificultad
    const diff = q.difficulty || 'sin-dificultad';
    stats.porDificultad[diff] = (stats.porDificultad[diff] || 0) + 1;
    
    // Con keywords
    if (q.keywords && q.keywords.length > 0) {
      stats.conKeywords++;
    }
    
    // Con respuesta esperada
    if (q.expectedResponse) {
      stats.conRespuestaEsperada++;
    }
  });
  
  log('\n📈 Estadísticas:', 'green');
  log(`   Total: ${stats.total}`, 'bright');
  log(`   Con keywords: ${stats.conKeywords} (${((stats.conKeywords / stats.total) * 100).toFixed(1)}%)`, 'cyan');
  log(`   Con respuesta esperada: ${stats.conRespuestaEsperada} (${((stats.conRespuestaEsperada / stats.total) * 100).toFixed(1)}%)`, 'cyan');
  
  log('\n📁 Por categoría:', 'yellow');
  Object.entries(stats.porCategoria)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      log(`   ${cat}: ${count} (${((count / stats.total) * 100).toFixed(1)}%)`, 'blue');
    });
  
  log('\n⚡ Por dificultad:', 'yellow');
  Object.entries(stats.porDificultad)
    .sort((a, b) => b[1] - a[1])
    .forEach(([diff, count]) => {
      log(`   ${diff}: ${count} (${((count / stats.total) * 100).toFixed(1)}%)`, 'blue');
    });
}

/**
 * Ejecutar tests con preguntas
 */
async function ejecutarTests(numPreguntas = 10) {
  log(`\n🧪 Ejecutando tests con ${numPreguntas} preguntas...`, 'cyan');
  const questions = await getQuestions({ limit: numPreguntas });
  
  if (questions.length === 0) {
    log('❌ No hay preguntas para testear', 'red');
    return;
  }
  
  log(`\n✅ Obtenidas ${questions.length} preguntas para testear`, 'green');
  log('📝 Ejecutando tests (esto puede tardar)...\n', 'yellow');
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    log(`\n[${i + 1}/${questions.length}] Probando: ${q.question.substring(0, 60)}...`, 'cyan');
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${BACKEND_URL}/webapi/chat/auto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Development': DEVELOPMENT,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q.question }],
          stream: false,
        }),
        timeout: 30000,
      });
      
      const elapsed = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        log(`   ✅ Pasó (${elapsed}ms)`, 'green');
        passed++;
      } else {
        log(`   ❌ Falló: HTTP ${response.status}`, 'red');
        failed++;
      }
    } catch (error) {
      log(`   ❌ Error: ${error.message}`, 'red');
      failed++;
    }
  }
  
  log(`\n📊 Resultados:`, 'green');
  log(`   ✅ Pasados: ${passed}`, 'green');
  log(`   ❌ Fallidos: ${failed}`, 'red');
  log(`   📈 Tasa de éxito: ${((passed / questions.length) * 100).toFixed(1)}%`, 'cyan');
}

/**
 * Main
 */
async function main() {
  const comando = process.argv[2];
  const argumento = process.argv[3];
  
  log('\n🚀 Trabajando con las 1000 preguntas del backend', 'bright');
  log(`📍 Backend: ${BACKEND_URL}`, 'cyan');
  log(`🔧 Development: ${DEVELOPMENT}\n`, 'cyan');
  
  try {
    switch (comando) {
      case 'listar':
        await listarPreguntas({ limit: argumento ? parseInt(argumento) : undefined });
        break;
      
      case 'buscar':
        if (!argumento) {
          log('❌ Debes proporcionar un texto para buscar', 'red');
          process.exit(1);
        }
        await buscarPreguntas(argumento);
        break;
      
      case 'categoria':
        if (!argumento) {
          log('❌ Debes proporcionar una categoría', 'red');
          process.exit(1);
        }
        await filtrarPorCategoria(argumento);
        break;
      
      case 'dificultad':
        if (!argumento) {
          log('❌ Debes proporcionar una dificultad (easy/medium/hard)', 'red');
          process.exit(1);
        }
        await filtrarPorDificultad(argumento);
        break;
      
      case 'exportar':
        await exportarPreguntas();
        break;
      
      case 'test':
        const num = argumento ? parseInt(argumento) : 10;
        await ejecutarTests(num);
        break;
      
      case 'estadisticas':
        await mostrarEstadisticas();
        break;
      
      default:
        log('\n📖 Uso:', 'yellow');
        log('   node scripts/trabajar-con-1000-preguntas.mjs [comando] [opciones]', 'cyan');
        log('\n📋 Comandos disponibles:', 'yellow');
        log('   listar [n]          - Listar preguntas (opcional: número de preguntas)', 'cyan');
        log('   buscar <texto>      - Buscar preguntas por texto', 'cyan');
        log('   categoria <cat>     - Filtrar por categoría', 'cyan');
        log('   dificultad <d>     - Filtrar por dificultad (easy/medium/hard)', 'cyan');
        log('   exportar            - Exportar todas las preguntas a JSON', 'cyan');
        log('   test [n]            - Ejecutar tests con n preguntas (default: 10)', 'cyan');
        log('   estadisticas        - Mostrar estadísticas de las preguntas', 'cyan');
        log('\n💡 Ejemplos:', 'yellow');
        log('   node scripts/trabajar-con-1000-preguntas.mjs listar 20', 'cyan');
        log('   node scripts/trabajar-con-1000-preguntas.mjs buscar "boda"', 'cyan');
        log('   node scripts/trabajar-con-1000-preguntas.mjs categoria wedding', 'cyan');
        log('   node scripts/trabajar-con-1000-preguntas.mjs test 50', 'cyan');
        log('   node scripts/trabajar-con-1000-preguntas.mjs estadisticas', 'cyan');
        process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
