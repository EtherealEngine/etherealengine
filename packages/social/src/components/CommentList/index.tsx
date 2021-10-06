/**
 * @author Tanya Vykliuk <tanya.vykliuk@gmail.com>
 */
import React from 'react'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useFeedCommentsState } from '../../reducers/feedComment/FeedCommentState'
import { FeedCommentService } from '../../reducers/feedComment/FeedCommentService'
import TextField from '@material-ui/core/TextField'
import SendIcon from '@material-ui/icons/Send'
import Grid from '@material-ui/core/Grid'

import CommentCard from '../CommentCard'

import styles from './CommentList.module.scss'

interface Props {
  feedId: string
}
const CommentList = ({ feedId }: Props) => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(FeedCommentService.getFeedComments(feedId))
  }, [])
  const [commentText, setCommentText] = useState('')
  const feedCommentsState = useFeedCommentsState()
  const addComment = (feedId, text) => {
    dispatch(FeedCommentService.addCommentToFeed(feedId, text))
    setCommentText('')
  }
  return (
    <section className={styles.commentsContainer}>
      <Grid container spacing={1} xs={6} alignItems="flex-end" style={{ margin: '20px 0px' }}>
        <Grid item xs>
          <TextField
            value={commentText}
            multiline={true}
            placeholder="Add comment"
            style={{ width: '100%' }}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </Grid>
        <Grid item xs>
          <SendIcon style={{ fontSize: 28 }} onClick={() => addComment(feedId, commentText)} />
        </Grid>
      </Grid>
      <>
        {feedCommentsState.feeds.feedComments.value &&
          feedCommentsState.feeds.fetching.value === false &&
          feedCommentsState.feeds.feedComments.value.map((item, key) => <CommentCard key={key} comment={item} />)}
      </>
    </section>
  )
}

export default CommentList
