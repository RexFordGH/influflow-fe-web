export interface Article {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  children: Article[];
  expanded: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  title: string;
  articles: Article[];
  expanded: boolean;
}