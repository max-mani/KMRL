import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let appInitialized = false;

function initializeFirebase(): void {
	if (appInitialized) return;
	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	let privateKey = process.env.FIREBASE_PRIVATE_KEY;
	const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

	if (!projectId || !clientEmail || !privateKey || !storageBucket) {
		logger.warn('Firebase not fully configured. Skipping initialization.');
		return;
	}

	// Handle escaped newlines in env var
	privateKey = privateKey.replace(/\\n/g, '\n');

	try {
		admin.initializeApp({
			credential: admin.credential.cert({
				projectId,
				clientEmail,
				privateKey
			} as admin.ServiceAccount),
			storageBucket
		});
		appInitialized = true;
		logger.info('Firebase initialized');
	} catch (err) {
		logger.error('Failed to initialize Firebase', err as any);
	}
}

export async function uploadBufferToFirebase(
	buffer: Buffer,
	destinationPath: string,
	contentType?: string
): Promise<{ bucket: string; path: string; publicUrl?: string } | null> {
	initializeFirebase();
	if (!appInitialized) return null;

	const bucket = admin.storage().bucket();
	const file = bucket.file(destinationPath);

	await file.save(buffer, {
		contentType,
		metadata: { contentType }
	});

	try {
		await file.makePublic();
		return {
			bucket: bucket.name,
			path: destinationPath,
			publicUrl: `https://storage.googleapis.com/${bucket.name}/${encodeURI(destinationPath)}`
		};
	} catch {
		return {
			bucket: bucket.name,
			path: destinationPath
		};
	}
}

export function isFirebaseConfigured(): boolean {
	return Boolean(
		process.env.FIREBASE_PROJECT_ID &&
		process.env.FIREBASE_CLIENT_EMAIL &&
		process.env.FIREBASE_PRIVATE_KEY &&
		process.env.FIREBASE_STORAGE_BUCKET
	);
}




