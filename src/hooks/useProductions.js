import React, { useState, useEffect } from 'react';
import { productionService } from '../api/services/productionService';
import toast from 'react-hot-toast';
import { getToday } from '../utils/dateUtils';

export const useProductions = () => {
  const [styles, setStyles] = useState([]);
  const [lots, setLots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [hourlyOutputs, setHourlyOutputs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadStyles = async () => {
    setLoading(true);
    try {
      const data = await productionService.getStyles();
      setStyles(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading styles:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadLots = async () => {
    setLoading(true);
    try {
      const data = await productionService.getLots();
      setLots(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading lots:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (active = true) => {
    setLoading(true);
    try {
      const data = await productionService.getAssignments(active);
      setAssignments(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading assignments:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadHourlyOutputs = async (date) => {
    const today = date || getToday();
    setLoading(true);
    try {
      const data = await productionService.getHourlyOutputs(today);
      // 🔥 PASTIKAN DATA DI-SET
      console.log('📊 Data hourly outputs:', data);
      setHourlyOutputs(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading hourly outputs:', error);
      setHourlyOutputs([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createLot = async (lotData) => {
    setLoading(true);
    try {
      const data = await productionService.createLot(lotData);
      toast.success('Lot berhasil dibuat');
      await loadLots();
      return data;
    } catch (error) {
      console.error('Error creating lot:', error);
      toast.error('Gagal membuat lot');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (assignmentData) => {
    setLoading(true);
    try {
      const data = await productionService.createAssignment(assignmentData);
      toast.success('Assignment berhasil dibuat');
      await loadAssignments();
      return data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Gagal membuat assignment');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createHourlyOutput = async (outputData) => {
    setLoading(true);
    try {
      const data = await productionService.createHourlyOutput(outputData);
      console.log('✅ Data tersimpan di Supabase:', data);
      toast.success('Data output berhasil disimpan');
      
      // 🔥 REFRESH DATA SETELAH SIMPAN
      const today = getToday();
      await loadHourlyOutputs(today);
      
      return data;
    } catch (error) {
      console.error('Error creating hourly output:', error);
      toast.error('Gagal menyimpan data output: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 LOAD DATA AWAL
  useEffect(() => {
    const init = async () => {
      await loadStyles();
      await loadLots();
      await loadAssignments();
      await loadHourlyOutputs(getToday());
    };
    init();
  }, []);

  return {
    styles,
    lots,
    assignments,
    hourlyOutputs,
    loading,
    loadStyles,
    loadLots,
    loadAssignments,
    loadHourlyOutputs,
    createLot,
    createAssignment,
    createHourlyOutput
  };
};