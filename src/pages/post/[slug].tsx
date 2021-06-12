import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import Head from 'next/head'

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';


import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Prismic from '@prismicio/client'
import Header from '../../components/Header'
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
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

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <span>Carregando...</span>;
  }
  const minutesToRead = post.data.content.reduce((acc, content) => {
    function countWords(str: string): number {
      return str.trim().split(/\s+/).length;
    }

    // eslint-disable-next-line no-param-reassign
    acc += countWords( content.heading) / 200;
    // eslint-disable-next-line no-param-reassign
    acc += countWords(RichText.asText(content.body)) / 200;

    return Math.ceil(acc);
  }, 0);

  return (
    <>
    <Head>
      <title>{ post.data.title }</title>
    </Head>
    <Header />
    <main className={styles.container}>
        <img src={post.data.banner.url} alt={post.data.title} />
        <article className={commonStyles.container}>
          <h1>{post.data.title}</h1>
          <div className={styles.data}>
            <time>
              <FiCalendar size={24} />
              { format(new Date(post.first_publication_date), 'dd MMM yyyy', {
      locale: ptBR
    }) }
            </time>
            <div className={styles.author}>
              <FiUser size={24} />
              {post.data.author}
            </div>
            <div className={styles.readTime}>
              <FiClock size={24} />
              {minutesToRead} min
            </div>
          </div>
          <div className={styles.content}>
            {post.data.content.map((content, index) => (
              <div key={String(index)}>
                <h2>{content.heading}</h2>
                <div
                  key={String(index)}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ],{
    fetch: ['post.title', 'post.subtitle', 'post.author', 'post.banner', 'post.content']
  });

  const paths = posts.results.map( post => ({
    params: {
      slug: post.uid
    }
  }) )

  return {
    paths,
    fallback: 'blocking'
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug),{});


  const post = {
    first_piblication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content

    }
  }


  return {
    props: {
      post
    },
    revalidate: 60 * 60 
  }
};
