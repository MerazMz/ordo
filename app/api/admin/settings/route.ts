import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/app/lib/auth';
import fs from 'fs';
import path from 'path';

// Simple file-based settings store (since no PlatformSettings model in DB)
const SETTINGS_FILE = path.join(process.cwd(), '.platform-settings.json');

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to read settings file:', e);
  }
  return { commissionRate: 10 };
}

function writeSettings(settings: object) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Failed to write settings file:', e);
    throw new Error('Failed to persist settings');
  }
}

async function adminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ordo-token')?.value;
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET() {
  try {
    const admin = await adminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = readSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await adminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commissionRate } = body;

    if (commissionRate !== undefined) {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json(
          { success: false, error: 'Commission rate must be between 0 and 100.' },
          { status: 400 }
        );
      }

      const current = readSettings();
      writeSettings({ ...current, commissionRate: rate });
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully.' });
  } catch (error: any) {
    console.error('Admin settings PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
