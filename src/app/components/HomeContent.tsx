'use client';

import { Header, Segment } from '@/lib/semantic-ui';
import Link from 'next/link';

export default function HomeContent() {
  return (
    <div className="markdown-body">
      {/* <Segment> */}
        <Header as="h2">About Me</Header>
        <p>
        一条川渝混血咸鱼。不吃辣。摇滚热，V 家粉，不通音律。乒乓迷，底板碳素 190，双面反胶，正手省狂，反手白金，直横混打。半吊子足球运动员，因膝部伤病引退。
        </p>

        <p>
        二零一八年加入信息学竞赛，二零二四年退役。此博客涵括各类笔记（主要是竞赛，也有些许物理）与各类难以分类的文章。如果你有任何意见，请通过 <Link href="mailto:cirnovsky@gmail.com">cirnovsky@gmail.com</Link> 联系。
        </p>
        <p>
          Feel free to explore my posts, and don't hesitate to reach out if you have any questions
          or would like to discuss any topics.
        </p>
      {/* </Segment> */}
      {/* <Segment> */}
        <Header as="h2">Latest Posts</Header>
        <p>
          Check out my latest posts in the <a href="/posts">posts section</a>.
        </p>
      {/* </Segment> */}
    </div>
  );
} 