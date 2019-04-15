import {
  gitPullStyle,
  gitPushStyle,
  repoPathStyle,
  repoRefreshStyle,
  repoStyle
} from '../componentsStyle/PathHeaderStyle';

import * as React from 'react';

import {classes} from 'typestyle';

import {Git, authObject} from '../git';

import {GitCredentialsForm} from './CredentialsBox'

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
        let retry = false;
        while (response.code != 0) {
          if (response.code == 1 && (response.message.indexOf('could not read Username')>=0 || response.message.indexOf('Auth or timeout error')>=0)) {
            const dialog = new Dialog({
              title: 'Git credentials required',
              body: new GitCredentialsForm('Enter credentials for remote repository', retry ? 'Incorrect username or password.' : ''),
              buttons: [
                  Dialog.cancelButton(),
                  Dialog.okButton({label: 'OK'})
              ]
            });
            const result = await dialog.launch();
            dialog.dispose();

            if (result.button.label == 'OK') {
              //user accepted attempt to login
              let auth_json = JSON.parse(decodeURIComponent(result.value));
              //call gitApi.pull again with credentials
              let auth: authObject = {
                username: auth_json.username,
                password: auth_json.password
              }
              response = await this.state.gitApi.pull(this.props.currentFileBrowserPath, auth);
            }
            else {
              //user cancelled attempt to log in
              this.showErrorDialog('Push failed');
              break;
            }
            retry = true;
          
          }
          else {
            this.showErrorDialog('Pull failed', response.message);
            break;
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
        let retry = false;
        while (response.code != 0) {
          if (response.code == 128 && (response.message.indexOf('could not read Username')>=0 || response.message.indexOf('Auth or timeout error')>=0)) {
            const dialog = new Dialog({
              title: 'Git credentials required',
              body: new GitCredentialsForm('Enter credentials for remote repository', retry ? 'Incorrect username or password.' : ''),
              buttons: [
                  Dialog.cancelButton(),
                  Dialog.okButton({label: 'OK'})
              ]
            });
            const result = await dialog.launch();
            dialog.dispose();

            if (result.button.label == 'OK') {
              //user accepted attempt to login
              let auth_json = JSON.parse(decodeURIComponent(result.value));
              //call gitApi.push again with credentials
              let auth: authObject = {
                username: auth_json.username,
                password: auth_json.password
              }
              response = await this.state.gitApi.push(this.props.currentFileBrowserPath, auth);
            }
            else {
              //user cancelled attempt to log in
              this.showErrorDialog('Push failed');
              break;
            }
            retry = true;
          }
          else {
            this.showErrorDialog('Push failed', response.message);
            break;
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