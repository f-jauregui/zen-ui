import {defineCustomElements} from '../dist/esm/loader';
import '@storybook/addon-console';
import { setConsoleOptions } from '@storybook/addon-console';
import styles from './preview.scss';

import React from 'react';

import {
  Title,
  Subtitle,
  Description,
  Primary,
  ArgsTable,
  Stories,
  PRIMARY_STORY
} from '@storybook/addon-docs/blocks';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: { expanded: false },
  docs: {
    page: () => (
        <>
          <Title />
          <Subtitle />
          <Primary />
          <h2>Playground</h2>
          <ArgsTable story={PRIMARY_STORY} />
          <Description />
          <Stories />
        </>
      ),
    extractComponentDescription: (component, { notes }) => {
      if (notes) {
        return typeof notes === 'string' ? notes : notes.markdown || notes.text;
      }
      return null;
    },
  },
}

const panelExclude = setConsoleOptions({}).panelExclude;
setConsoleOptions({
  panelExclude: [...panelExclude, /deprecated/],
});

defineCustomElements();
