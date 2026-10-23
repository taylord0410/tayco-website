import {redirect} from 'next/navigation';
// Historical prototype links resolve through the authenticated portal; no static tenant data is served.
export default function HistoricalPortal(){redirect('/portal');}
