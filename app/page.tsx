import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the new conversaton page only for now
  // TODO: Add more logic depending on user role
  redirect('/new');
}
