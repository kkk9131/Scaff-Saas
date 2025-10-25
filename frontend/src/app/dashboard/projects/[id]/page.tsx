import { redirect } from 'next/navigation';

interface ProjectDetailRedirectProps {
  params: {
    id: string;
  };
}

/**
 * 旧ルート（/dashboard/projects/[id]）へのアクセスを
 * 新しい詳細ページ /projects/[id] にリダイレクトします。
 *
 * App Routerのサーバーコンポーネントで即時にリダイレクトさせることで
 * 既存ブックマークや古いリンクに対してもシームレスに対応できます。
 */
export default function ProjectDetailRedirect({ params }: ProjectDetailRedirectProps) {
  if (params?.id) {
    redirect(`/projects/${params.id}`);
  }

  redirect('/dashboard/projects');
}

