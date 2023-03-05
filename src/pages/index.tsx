import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function loadNextPage(): Promise<void> {
    const response = await fetch(postsPagination.next_page);
    const { next_page, results } = await response.json();
    setPosts([...posts, ...results]);
    setNextPage(next_page);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <div className={styles.container}>
        <img src="/images/logo.svg" alt="logo" />
        {posts.map((post, index) => (
          <Link href={`/post/${post.uid ?? '404'}`} key={post.uid ?? index}>
            <a>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <time>
                <FiCalendar />{' '}
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
              <span>
                <FiUser /> {post.data.author}
              </span>
            </a>
          </Link>
        ))}

        {nextPage && (
          <button type="button" onClick={loadNextPage}>
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
      orderings: '[my.post.date desc]',
    }
  );

  return {
    props: {
      postsPagination: {
        results: postsResponse.results,
        next_page: postsResponse.next_page,
      },
    },
  };
};
