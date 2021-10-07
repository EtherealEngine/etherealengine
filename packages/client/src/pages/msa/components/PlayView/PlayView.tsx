import React from 'react'
import styles from './PlayView.module.scss'
import { Card, CardMedia, Grid } from '@mui/material'
import { Link } from 'react-router-dom'
import FooterNews from '../Common/FooterNews'

const PlayView = (): any => {
  return (
    <>
      <Grid
        container
        className={styles.App + ' ' + styles.pageBackground}
        style={{ backgroundImage: `url('/static/msa/full_screen_background.svg')`, backgroundColor: '#181818' }}
      >
        <Grid container justifyContent="space-between" alignContent="center">
          <Grid item alignSelf={'center'} sx={{ display: 'flex', marginLeft: '6%' }}>
            <img src="/static/msa/Group.png" alt="logo" />
            <img style={{ marginLeft: '5%', alignSelf: 'center' }} src="/static/msa/METASPORTS.png" alt="meta sports" />
          </Grid>

          <Grid item sx={{ cursor: 'pointer' }}>
            <Card sx={{ borderRadius: '8px 0 0 8px' }}>
              <Grid container alignItems={'center'}>
                <div style={{ marginLeft: '20px', marginRight: '20px', alignSelf: 'center' }}>
                  <img src="/static/msa/ic-notification.png" alt="Notification" />
                </div>
                <img src="/static/msa/la-lakers-logo.png" alt="LA-Lakers" style={{ height: 'auto' }} />
                <Grid item style={{ marginLeft: '20px', marginRight: '50px' }}>
                  <span style={{ fontSize: '16px', lineHeight: '19px' }}>SwipeStealBall</span>
                  <Grid container justifyContent={'center'} sx={{ marginTop: '5%' }}>
                    <img src="/static/msa/img-dollar.png" alt="Dollar sign" />
                    <span style={{ fontSize: '16px', lineHeight: '19px', marginLeft: '5%' }}>100,000</span>
                  </Grid>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>

        <Grid container justifyContent="center" alignContent="center" spacing={3}>
          <Grid item>
            <Link to={'/msa/manage-team-staked'}>
              <div
                style={{ position: 'relative' }}
                className={styles.cardBackgroundBig + ' ' + styles.cardBackgroundGreenTop}
              >
                <CardMedia component="img" image="/static/msa/image 349.png" />

                <div className={styles.cardBackgroundGreenBottom + ' ' + styles.overlay}>
                  <p>
                    <span className={styles.cardTitleText}>
                      PLAY <span style={{ fontWeight: 'bold' }}>STAKED</span>
                    </span>
                    <br />
                    <span className={styles.cardSubtitleText}>
                      Put your team in, pick from a staked or unstaked, and start playing.
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          </Grid>

          <Grid item>
            <Link to={'/msa/manage-team-unstaked'}>
              <div
                style={{ position: 'relative' }}
                className={styles.cardBackgroundBig + ' ' + styles.cardBackgroundBlueTop}
              >
                <CardMedia component="img" image="/static/msa/Mask Group.png" />

                <div className={styles.cardBackgroundBlueBottom + ' ' + styles.overlay}>
                  <p>
                    <span className={styles.cardTitleText}>
                      PLAY <span style={{ fontWeight: 'bold' }}>UNSTAKED</span>
                    </span>
                    <br />
                    <span className={styles.cardSubtitleText}>
                      Manage your squad, set starters & bench, and toggle play time.
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          </Grid>

          <Grid item>
            <Link to={'/msa/manage-team-tournament'}>
              <div
                style={{ position: 'relative' }}
                className={styles.cardBackgroundBig + ' ' + styles.cardBackgroundBlueTop}
              >
                <CardMedia component="img" image="/static/msa/Mask Group.png" />

                <div className={styles.cardBackgroundBlueBottom + ' ' + styles.overlay}>
                  <p>
                    <span className={styles.cardTitleText}>
                      PLAY <span style={{ fontWeight: 'bold' }}>TOURNAMENT</span>
                    </span>
                    <br />
                    <span className={styles.cardSubtitleText}>
                      Manage your squad, set starters & bench, and toggle play time.
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          </Grid>

          <Grid item xs={3}>
            <Grid
              container
              direction={'column'}
              justifyContent={'space-between'}
              style={{ height: '100%', width: '85%' }}
            >
              <Grid item style={{ height: '47%' }}>
                <Link to={'#'}>
                  <div
                    style={{ position: 'relative', height: '100%', width: '100%' }}
                    className={styles.cardBackgroundSmall + ' ' + styles.cardBackgroundPurpleTop}
                  >
                    <div style={{ marginTop: '10%' }}>
                      <img className="m-1" src="/static/msa/pngegg.png" alt="box" />
                      <img className="m-1" src="/static/msa/pngegg.png" alt="box" />
                      <img className="m-1" src="/static/msa/pngegg.png" alt="box" />
                    </div>
                    <div className={styles.overlay}>
                      <p>
                        <span className={styles.cardTitleText} style={{ fontWeight: 'bold' }}>
                          PRIVATE GAME
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>
              </Grid>

              <Grid item style={{ height: '47%' }}>
                <Link to={'#'}>
                  <div
                    style={{ position: 'relative', height: '100%', width: '100%' }}
                    className={styles.cardBackgroundSmall + ' ' + styles.cardBackgroundOrangeTop}
                  >
                    <img
                      src="/static/msa/ic-settings.png"
                      style={{ alignSelf: 'center', padding: '10%' }}
                      alt="Settings"
                    />

                    <div className={styles.cardBackgroundOrangeBottom + ' ' + styles.overlay}>
                      <p>
                        <span className={styles.cardTitleText} style={{ fontWeight: 'bold' }}>
                          TUTORIAL
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <FooterNews news="MetaSports Association News Here" />
      </Grid>
    </>
  )
}

export default PlayView
