'use client';

import { useEffect, useRef, useState } from 'react';

import { performanceMonitor } from '@/utils/performanceMonitor';
import { logAnalyzer } from '@/utils/logAnalyzer';
import { blockingDetector } from '@/utils/blockingDetector';

import { AppLoadingStage, CLIENT_LOADING_STAGES } from '../stage';
import Content from './Content';
import Redirect from './Redirect';

const ClientMode = () => {
  // ✅ OPTIMIZACIÓN ULTRA RÁPIDA: Empezar directamente en GoToChat
  // No mostrar pantalla de loading, ir directamente al chat
  const [activeStage, setActiveStage] = useState<string>(AppLoadingStage.GoToChat);
  const previousStageRef = useRef<string>(AppLoadingStage.GoToChat);
  const totalStartTimeRef = useRef<number | null>(null);

  // ✅ MEDICIÓN: Iniciar medición global cuando se monta el componente
  useEffect(() => {
    totalStartTimeRef.current = performance.now();
    performanceMonitor.startPhase('TOTAL_LOADING');
    performanceMonitor.startPhase(AppLoadingStage.GoToChat);
    previousStageRef.current = AppLoadingStage.GoToChat;

    // ✅ Detectar bloqueos
    blockingDetector.startOperation('ClientMode_Mount');
    setTimeout(() => {
      blockingDetector.endOperation('ClientMode_Mount');
    }, 0);

    // ✅ Exponer herramientas globalmente para acceso desde consola
    if (typeof window !== 'undefined') {
      (window as any).logAnalyzer = logAnalyzer;
      (window as any).performanceMonitor = performanceMonitor;
      (window as any).blockingDetector = blockingDetector;
      // console.log('💡 [DEBUG] Herramientas disponibles:');
      // console.log('  - window.logAnalyzer.printReport()');
      // console.log('  - window.performanceMonitor.printSummary()');
      // console.log('  - window.blockingDetector.printReport()');
    }

    // ✅ MEDICIÓN: Imprimir resumen cuando termine la carga (después de 5 segundos)
    // Y también después de 30 segundos, 60 segundos, 120 segundos para cargas lentas
    const summaryTimeout1 = setTimeout(() => {
      console.warn('⚠️ [PERF] Carga tardando más de 5 segundos...');
      performanceMonitor.printSummary();
    }, 5000);

    const summaryTimeout2 = setTimeout(() => {
      console.warn('⚠️ [PERF] Carga tardando más de 30 segundos...');
      performanceMonitor.printSummary();
      logAnalyzer.printReport();
    }, 30_000);

    const summaryTimeout3 = setTimeout(() => {
      console.warn('⚠️ [PERF] Carga tardando más de 60 segundos...');
      performanceMonitor.printSummary();
      logAnalyzer.printReport();
      blockingDetector.printReport();
    }, 60_000);

    const summaryTimeout4 = setTimeout(() => {
      console.error('❌ [PERF] Carga tardando más de 120 segundos - ANÁLISIS COMPLETO');
      performanceMonitor.endPhase('TOTAL_LOADING');
      performanceMonitor.printSummary();
      logAnalyzer.printReport();
      blockingDetector.printReport();
    }, 120_000);

    return () => {
      clearTimeout(summaryTimeout1);
      clearTimeout(summaryTimeout2);
      clearTimeout(summaryTimeout3);
      clearTimeout(summaryTimeout4);
    };
  }, []);

  // ✅ MEDICIÓN: Medir cambios de etapa
  useEffect(() => {
    if (previousStageRef.current !== activeStage) {
      // Finalizar etapa anterior
      performanceMonitor.endPhase(previousStageRef.current);
      // Iniciar nueva etapa
      performanceMonitor.startPhase(activeStage);
      previousStageRef.current = activeStage;
    }
  }, [activeStage]);

  // ✅ Wrapper para setActiveStage que mide el tiempo
  // ✅ CRÍTICO: Prevenir que el stage retroceda una vez que llegue a GoToChat
  const hasReachedGoToChatRef = useRef(false);
  const maxStageIndexReachedRef = useRef<number>(CLIENT_LOADING_STAGES.indexOf(AppLoadingStage.GoToChat));

  const setActiveStageWithMeasurement = (stage: string) => {
    // ✅ Si llegamos a GoToChat, marcar y no permitir retroceder nunca
    if (stage === AppLoadingStage.GoToChat) {
      hasReachedGoToChatRef.current = true;
      maxStageIndexReachedRef.current = CLIENT_LOADING_STAGES.length - 1;
      // console.log(`✅ [Loading] Llegamos a GoToChat, bloqueando retrocesos`);
      setActiveStage(stage);
      return;
    }

    // ✅ Si ya llegamos a GoToChat, bloquear CUALQUIER cambio que no sea GoToChat
    if (hasReachedGoToChatRef.current) {
      console.warn(`🚫 [Loading] Bloqueando cambio desde ${activeStage} a ${stage} - ya llegamos a GoToChat`);
      return;
    }

    // ✅ Solo permitir avanzar hacia adelante, no retroceder
    const currentIndex = CLIENT_LOADING_STAGES.indexOf(activeStage);
    const newIndex = CLIENT_LOADING_STAGES.indexOf(stage);

    // Si el nuevo stage no está en la lista, permitirlo solo si no hemos llegado a GoToChat
    if (newIndex === -1) {
      if (!hasReachedGoToChatRef.current) {
        setActiveStage(stage);
      }
      return;
    }

    // ✅ Solo permitir avanzar hacia adelante
    if (newIndex > maxStageIndexReachedRef.current) {
      maxStageIndexReachedRef.current = newIndex;
      setActiveStage(stage);
    } else if (newIndex < maxStageIndexReachedRef.current) {
      console.warn(`🚫 [Loading] Bloqueando retroceso desde índice ${currentIndex} (${activeStage}) a índice ${newIndex} (${stage})`);
    }
  };

  return (
    <>
      <Content loadingStage={activeStage} setActiveStage={setActiveStageWithMeasurement} />
      <Redirect setActiveStage={setActiveStageWithMeasurement} />
    </>
  );
};

ClientMode.displayName = 'ClientMode';

export default ClientMode;
