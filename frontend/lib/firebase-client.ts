import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics, logEvent } from 'firebase/analytics';

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export function getFirebaseApp() {
	return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
	try {
		if (typeof window === 'undefined') return null;
		const supported = await isSupported();
		if (!supported) return null;
		const app = getFirebaseApp();
		return getAnalytics(app);
	} catch {
		return null;
	}
}

export async function safeLogAnalyticsEvent(eventName: string, params?: Record<string, any>): Promise<void> {
	const analytics = await getFirebaseAnalytics();
	if (!analytics) return;
	try {
		logEvent(analytics, eventName, params);
	} catch {
		// no-op
	}
}




