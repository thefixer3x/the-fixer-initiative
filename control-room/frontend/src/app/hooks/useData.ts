import { useState, useEffect } from 'react';
import * as api from '../lib/api';

export function useProjects() {
  const [projects, setProjects] = useState<api.Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const data = await api.getProjects();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return { projects, loading, error };
}

export function useClients() {
  const [clients, setClients] = useState<api.Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const data = await api.getClients();
        setClients(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  return { clients, loading, error };
}

export function useVendors() {
  const [vendors, setVendors] = useState<api.Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoading(true);
        const data = await api.getVendors();
        setVendors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchVendors();
  }, []);

  return { vendors, loading, error };
}

export function useBillingRecords() {
  const [billingRecords, setBillingRecords] = useState<api.BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBillingRecords() {
      try {
        setLoading(true);
        const data = await api.getBillingRecords();
        setBillingRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchBillingRecords();
  }, []);

  return { billingRecords, loading, error };
}