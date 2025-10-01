'use client';
import { useEffect } from 'react';
import { safeLogAnalyticsEvent } from '@/lib/firebase-client';

type Props = {
	page: 'fleet_status' | 'maintenance' | 'performance' | 'insights' | 'history' | 'what_if';
	attributes?: Record<string, any>;
};

export default function GATracker({ page, attributes }: Props) {
	useEffect(() => {
		(async () => {
			await safeLogAnalyticsEvent(`view_${page}`, attributes);
		})();
	}, [page]);

	return null;
}


