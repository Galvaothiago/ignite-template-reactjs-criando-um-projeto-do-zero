import { GetStaticProps } from 'next';
import  Head  from 'next/head';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import Header from '../components/Header'
import { FiCalendar, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Link from 'next/link'

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

export default function Home({ postsPagination }: HomeProps) {
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string>(next_page);

  function loadPosts() {
    if (nextPage) {
      fetch(nextPage)
        .then(response => response.json())
        .then(data => {
          const newPosts = data.results.map((post: Post) => ({
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author:  post.data.author,
            }
          }))
          
          setNextPage(data.next_page);
          setPosts([...newPosts, ...posts]);
        })
        .catch(() => {
          alert('Erro na aplicação!');
        });
    }
  }
  
  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <Header />
      <div className={commonStyles.container}>
          <div className={ styles.containerPost }>
              { posts.map( post => (
                <Link key={post.uid} href={`/post/${post.uid}`}>
                  <div>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <div className={styles.data}>
                  <time>
                    <FiCalendar size={24} />
                    {format(new Date(post.first_publication_date), 'dd MMM u', {
                    locale: ptBR,
                  })}
                  </time>
                  <div className={styles.author}>
                    <FiUser size={24} />
                    {post.data.author}
                  </div>
                </div>
                  </div>
                </Link>
          )) }
            {nextPage && (
          <strong className={styles.loadPosts} onClick={loadPosts}>
            Carregar mais posts
          </strong>
        )}
          </div>
      </div>
    </>
  )
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 3
  });

  const { next_page, results } = postsResponse

  const posts: Post[] = results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  const timeToRevalidate = 60 * 3;

  return {
    props: {
      postsPagination: {
        next_page,
        results: posts,
      },
    },
    revalidate: timeToRevalidate,
  };
};
