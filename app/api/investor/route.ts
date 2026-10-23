import {NextRequest} from 'next/server';
import {receive} from '../submission';
export const runtime='nodejs';
export async function POST(request:NextRequest){return receive(request,'investor');}
