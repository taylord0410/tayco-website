import { notFound } from 'next/navigation';
import SecurityLab from '@/components/SecurityLab';
export const dynamic='force-dynamic';
export default function SecurityLabPage(){
  if(process.env.NODE_ENV==='production'||process.env.TAYCO_SECURITY_LAB!=='1')notFound();
  return <SecurityLab/>;
}
