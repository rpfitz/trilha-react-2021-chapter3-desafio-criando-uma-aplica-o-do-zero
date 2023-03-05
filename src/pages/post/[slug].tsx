import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
      alt: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  function getReadingTime(): number {
    const content = post.data.content.reduce((words, postContent) => {
      // eslint-disable-next-line no-param-reassign
      words += `${postContent.heading} `;
      // eslint-disable-next-line no-param-reassign
      words += RichText.asText(postContent.body);
      return words;
    }, '');

    const wordCount = content.split(/\s/).length;

    return Math.ceil(wordCount / 200);
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <Header />
      <div className={styles.container}>
        <img src={post.data.banner.url} alt={post.data.banner.alt} />
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <time>
            <FiClock />{' '}
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </time>
          <span>
            <FiUser /> {post.data.author}
          </span>
          <time>
            <FiCalendar /> {`${getReadingTime()} min`}
          </time>
          {post.data.content.map(session => (
            <div className={styles.session} key={session.heading}>
              <h2>{session.heading}</h2>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(session.body),
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    { pageSize: 2, fetch: ['posts.uid'] }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  return {
    props: { post: response },
    redirect: 60 * 30, // 30 minutos
  };
};
