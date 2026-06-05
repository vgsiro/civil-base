export interface RankViewer {
  id: string
  interests: string[]   // maps to profile.specializations + post category history
}

export interface RankPost {
  id: string
  authorId: string
  createdAt: number     // unix ms
  tags: string[]        // category + any explicit tags
  stats: {
    likes:       number
    comments:    number
    shares:      number
    impressions: number
  }
}

export interface RankInteraction {
  userId:   string
  postId:   string
  authorId: string
  action:   string      // view | like | comment | share | hide | report
  at:       number      // unix ms
}

export interface ScoredPost {
  post:      RankPost
  score:     number
  breakdown: Record<string, number>
}
