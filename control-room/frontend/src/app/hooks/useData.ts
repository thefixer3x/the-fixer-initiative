'use client';

import { useState, useEffect } from 'react';
import {
    getProjects,
    getClients,
    getVendors,
    getBillingRecords
} from '../lib/api';
import { Project, Client, Vendor, BillingRecord } from '../lib/types';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchProjects() {
            try {
                const data = await getProjects();
                setProjects(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, []);

    return { projects, loading, error };
}

export function useClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchClients() {
            try {
                const data = await getClients();
                setClients(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchClients();
    }, []);

    return { clients, loading, error };
}

export function useVendors() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchVendors() {
            try {
                const data = await getVendors();
                setVendors(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchVendors();
    }, []);

    return { vendors, loading, error };
}

export function useBillingRecords() {
    const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchBillingRecords() {
            try {
                const data = await getBillingRecords();
                setBillingRecords(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchBillingRecords();
    }, []);

    return { billingRecords, loading, error };
}