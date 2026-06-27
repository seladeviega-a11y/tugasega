import { useState, useEffect } from 'react';
import { constraintService } from '../api/services/constraintService';
import toast from 'react-hot-toast';

export const useConstraints = () => {
  const [constraints, setConstraints] = useState([]);
  const [summary, setSummary] = useState({ total: 0, totalDowntime: 0, byType: {} });
  const [loading, setLoading] = useState(false);

  const loadConstraints = async (date) => {
    setLoading(true);
    try {
      const data = await constraintService.getConstraints(date);
      setConstraints(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error loading constraints:', error);
      setConstraints([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (date) => {
    setLoading(true);
    try {
      const data = await constraintService.getConstraintSummary(date);
      // Pastikan data selalu punya properti yang benar
      const safeSummary = {
        total: data?.total ?? 0,
        totalDowntime: data?.totalDowntime ?? 0,
        byType: data?.byType ?? {}
      };
      setSummary(safeSummary);
      return safeSummary;
    } catch (error) {
      console.error('Error loading summary:', error);
      const emptySummary = { total: 0, totalDowntime: 0, byType: {} };
      setSummary(emptySummary);
      return emptySummary;
    } finally {
      setLoading(false);
    }
  };

  const createConstraint = async (constraintData) => {
    setLoading(true);
    try {
      const data = await constraintService.createConstraint(constraintData);
      toast.success('Kendala berhasil dilaporkan');
      return data;
    } catch (error) {
      console.error('Error creating constraint:', error);
      toast.error('Gagal melaporkan kendala');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setLoading(true);
    try {
      const data = await constraintService.updateConstraintStatus(id, status);
      toast.success('Status kendala diperbarui');
      return data;
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Gagal memperbarui status');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Tidak auto-load di useEffect untuk menghindari error
  // useEffect(() => {
  //   const today = new Date().toISOString().split('T')[0];
  //   loadConstraints(today);
  //   loadSummary(today);
  // }, []);

  return {
    constraints,
    summary,
    loading,
    loadConstraints,
    loadSummary,
    createConstraint,
    updateStatus
  };
};