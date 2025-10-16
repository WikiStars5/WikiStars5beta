
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-wikistars5-app-please-change';
const secret = new TextEncoder().encode(JWT_SECRET);

// Esta API se ha eliminado porque ya no usamos tokens JWT personalizados.
// La autenticación ahora se maneja directamente a través del SDK de Firebase
// y el estado se gestiona en el lado del cliente con onAuthStateChanged.
// Dejamos el archivo para evitar errores 404 si alguna parte del código antiguo lo llama.
export async function POST(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'This endpoint is deprecated.' }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: 'This endpoint is deprecated.' }, { status: 410 });
}

export async function GET() {
    return NextResponse.json({ session: null, error: 'This endpoint is deprecated.' }, { status: 410 });
}
