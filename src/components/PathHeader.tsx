import {
  gitPullStyle,
  gitPushStyle,
  repoPathStyle,
  repoRefreshStyle,
  repoStyle
} from '../componentsStyle/PathHeaderStyle';

import {
  Widget
} from "@phosphor/widgets";

import * as React from 'react';

import {classes} from 'typestyle';

import {Git} from '../git';

import {Dialog, showDialog} from '@jupyterlab/apputils';

export interface IPathHeaderState {
  refresh: any;
  gitApi: Git;
}

export interface IPathHeaderProps {
  currentFileBrowserPath: string;
  topRepoPath: string;
  refresh: any;
  currentBranch: string;
  isLightTheme: string;
}

export class PathHeader extends React.Component<IPathHeaderProps,
  IPathHeaderState> {
  constructor(props: IPathHeaderProps) {
    super(props);
    this.state = {
      refresh: props.refresh,
      gitApi: new Git()
    };
  }

  render() {
    let relativePath = this.props.currentFileBrowserPath.split('/');
    return (
      <div className={repoStyle}>
        <span className={repoPathStyle}>
          {relativePath[relativePath.length - 1] +
          ' / ' +
          this.props.currentBranch}
        </span>
        <button
          className={classes(gitPullStyle(this.props.isLightTheme), 'jp-Icon-16')}
          title={'Pull latest changes'}
          onClick={() => this.executeGitPull()}
        />
        <button
          className={classes(gitPushStyle(this.props.isLightTheme), 'jp-Icon-16')}
          title={'Push committed changes'}
          onClick={() => this.executeGitPush()}
        />
        <button
          className={classes(repoRefreshStyle, 'jp-Icon-16')}
          onClick={() => this.props.refresh()}
        />
      </div>
    );
  }

  /**
   * Execute the `/git/pull` API
   */
  private executeGitPull(): void {
    this.state.gitApi.pull(this.props.currentFileBrowserPath)
      .then(async response => {
        if (response.code != 0) {
          if (response.code == 1 && response.message.indexOf('could not read Username')>=0) {
            const dialog = new Dialog({
              title: 'Git credentials required',
              body: new GitCredentialsForm(),
              buttons: [
                  Dialog.cancelButton(),
                  Dialog.okButton({label: 'OK'})
              ]
            });
            const result = await dialog.launch();
            dialog.dispose();

            if (result.button.label == 'OK') {
              let auth = JSON.parse(decodeURIComponent(result.value));
              //call gitApi.pull again with credentials
              this.state.gitApi.pull(this.props.currentFileBrowserPath, auth.username, auth.password);
            }
            else {
              this.showErrorDialog('Push failed');
            }
          
          }
          else {
            this.showErrorDialog('Pull failed', response.message);
          }
          
        }
      })
      .catch(() => this.showErrorDialog('Pull failed'));
  }

  /**
   * Execute the `/git/push` API
   */
  private executeGitPush(): void {
    this.state.gitApi.push(this.props.currentFileBrowserPath)
      .then(async response => {
        if (response.code != 0) {
          if (response.code == 128 && response.message.indexOf('could not read Username')>=0) {
            const dialog = new Dialog({
              title: 'Git credentials required',
              body: new GitCredentialsForm(),
              buttons: [
                  Dialog.cancelButton(),
                  Dialog.okButton({label: 'OK'})
              ]
            });
            const result = await dialog.launch();
            dialog.dispose();

            if (result.button.label == 'OK') {
              let auth = JSON.parse(decodeURIComponent(result.value));
              //call gitApi.push again with credentials
              this.state.gitApi.push(this.props.currentFileBrowserPath, auth.username, auth.password);
            }
            else {
              this.showErrorDialog('Push failed');
            }
          }
          else {
            this.showErrorDialog('Push failed', response.message);
          }
        }
      })
      .catch(() => this.showErrorDialog('Push failed'));
  }

  /**
   * Displays the error dialog when the Git Push/Pull operation fails.
   * @param title the title of the error dialog
   * @param body the message to be shown in the body of the modal.
   */
  private showErrorDialog(title: string, body: string = ''): Promise<void> {
    return showDialog({
      title: title,
      body: body,
      buttons: [Dialog.warnButton({label: 'DISMISS'})]
    }).then(() => {
      // NO-OP
    });
  }
}

/**
 * The UI for the credentials form
 */
class GitCredentialsForm extends Widget {
    
  /**
   * Create a redirect form.
   */
  constructor() {
      super({node: GitCredentialsForm.createFormNode()});
  }

  private static createFormNode(): HTMLElement {
      const node = document.createElement('div');
      const label = document.createElement('label');
      const user = document.createElement('input');
      const password = document.createElement('input');
      password.type = 'password';
      password.id = 'git_password';

      const text = document.createElement('span');
      const warning = document.createElement('div');

      node.className = 'jp-RedirectForm';
      warning.className = 'jp-RedirectForm-warning';
      text.textContent = 'Enter credentials for provided repository';
      user.placeholder = 'user';

      label.appendChild(text);
      label.appendChild(user);
      label.appendChild(password);
      node.appendChild(label);
      node.appendChild(warning);
      return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): string {
      let lines = this.node.querySelectorAll('input');
      let credentials = {
          username: lines[0].value,
          password : lines[1].value,
      }
      return encodeURIComponent(JSON.stringify(credentials));
  }

}