import React, { useEffect, useState } from 'react';
import styles from './Me.module.scss';
import PartyParticipantWindow from '../PartyParticipantWindow';
import { Grid } from '@material-ui/core';
import { MediaStreamSystem } from '@xr3ngine/engine/src/networking/systems/MediaStreamSystem';
import { observer } from 'mobx-react';

const Me = observer(() => {
    // Listening on MediaStreamSystem doesn't appear to register for some reason, but listening
    // to an observable property of it does.

  return (
    <Grid className={styles['me-party-user-container']} container>
      <PartyParticipantWindow
          containerProportions={{
            height: 135,
            width: 240
          }}
          peerId={'me_cam'}
      />
        {
            (MediaStreamSystem.instance?.screenVideoProducer || MediaStreamSystem.instance?.screenAudioProducer) && <PartyParticipantWindow
                containerProportions={{
                    height: 135,
                    width: 240
                }}
                peerId={'me_screen'}
            />
        }
    </Grid>
  );
});

export default Me;
