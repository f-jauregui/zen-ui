/// <reference types="cypress" />

describe('Drawer visual tests', { scrollBehavior: 'center' }, () => {
  const pageId = 'layout-drawer--default';
  const story = ['story--layout-drawer--default-story'];

  before(() => {
    cy.visitStorybookIframe(pageId);
    cy.verifyAllStoriesHaveVRT(story);
  });

  it('Verifies ' + `${story[0]}`, () => {
    cy.get(`#${story[0]}`).matchImageSnapshot();
  });

  it('Verifies that drawer opens ' + `${story[0]}`, () => {
    cy.get(`#${story[0]}`)
      .within(() => {
        cy.get('.btn-primary').click();
        cy.get('sb-zen-drawer').should('be.visible');
      })
      .parents('.innerZoomElementWrapper')
      .matchImageSnapshot();
  });

  it('Verifies that we can set position and drawer opens ' + `${story[0]}`, () => {
    cy.get(`#${story[0]}`)
      .within(() => {
        cy.get('sb-zen-drawer[position]')
          .invoke('attr', 'position', 'left')
          .should('have.attr', 'data-position', 'left');
        cy.get('.btn-primary').click();
        cy.get('sb-zen-drawer').should('be.visible');
      })
      .parents('.innerZoomElementWrapper')
      .matchImageSnapshot();
  });

  it('Verifies that drawer closes on close icon ' + `${story[0]}`, () => {
    cy.get(`#${story[0]}`)
      .within(() => {
        cy.get('.btn-primary').click();
        cy.get('sb-zen-drawer').should('have.attr', 'opened');
        cy.get('.close-icon').click();
        cy.get('sb-zen-drawer').should('not.have.attr', 'opened');
      })
      .parents('.innerZoomElementWrapper')
      .matchImageSnapshot();
  });
});
