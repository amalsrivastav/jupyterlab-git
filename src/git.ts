import { ServerConnection } from '@jupyterlab/services';

import { URLExt } from '@jupyterlab/coreutils';

'use strict';



/** Function type for diffing a file's revisions */
export type IDiffCallback = (
  filename: string,
  revisionA: string,
  revisionB: string
) => void;

/** Interface for GitAllHistory request result,
 * has all repo information */
export interface GitAllHistory {
  code: number;
  data?: {
    show_top_level?: GitShowTopLevelResult;
    branch?: GitBranchResult;
    log?: GitLogResult;
    status?: GitStatusResult;
  };
}

/** Interface for GitShowTopLevel request result,
 * has the git root directory inside a repository */
export interface GitShowTopLevelResult {
  code: number;
  top_repo_path?: string;
}

/** Interface for GitShowPrefix request result,
 * has the prefix path of a directory in a repository,
 * with respect to the root directory. */
export interface GitShowPrefixResult {
  code: number;
  under_repo_path?: string;
}

/** Interface for GitShowPrefix request result,
 * has the prefix path of a directory in a repository,
 * with respect to the root directory. */
export interface GitCheckoutResult {
  code: number;
  message?: string;
}

/** Interface for GitBranch request result,
 * has the result of changing the current working branch */
export interface GitBranchResult {
  code: number;
  branches?: Array<{
    is_current_branch: boolean;
    is_remote_branch: boolean;
    name: string;
    upstream: string;
    top_commit: string;
    tag: string;
  }>;
}

/** Interface for GitStatus request result,
 * has the status of each changed file */
export interface GitStatusFileResult {
  x: string;
  y: string;
  to: string;
  from: string;
}

/** Interface for GitStatus request result,
 * has the status of the entire repo */
export interface GitStatusResult {
  code: number;
  files?: [GitStatusFileResult];
}

/** Interface for GitLog request result,
 * has the info of a single past commit */
export interface SingleCommitInfo {
  commit: string;
  author: string;
  date: string;
  commit_msg: string;
  pre_commit: string;
}

/** Interface for GitCommit request result,
 * has the info of a committed file */
export interface CommitModifiedFile {
  modified_file_path: string;
  modified_file_name: string;
  insertion: string;
  deletion: string;
}

/** Interface for GitDetailedLog request result,
 * has the detailed info of a single past commit */
export interface SingleCommitFilePathInfo {
  code: number;
  modified_file_note?: string;
  modified_files_count?: string;
  number_of_insertions?: string;
  number_of_deletions?: string;
  modified_files?: [CommitModifiedFile];
}

/** Interface for GitLog request result,
 * has the info of all past commits */
export interface GitLogResult {
  code: number;
  commits?: [SingleCommitInfo];
}

/** Makes a HTTP request, sending a git command to the backend */
function httpGitRequest(
  url: string,
  method: string,
  request: Object
): Promise<Response> {
  let fullRequest = {
    method: method,
    body: JSON.stringify(request)
  };

  let setting = ServerConnection.makeSettings();
  let fullUrl = URLExt.join(setting.baseUrl, url);
  return ServerConnection.makeRequest(fullUrl, fullRequest, setting);
}

/**
 * Structure for the result of the Git Clone API.
 */
export interface GitCloneResult {
  code: number;
  message?: string;
}

/**
 * Structure for the result of the Git Commit API.
 */
export interface GitCommitResult {
  code: number;
  message?: string;
}

/**
 * Structure for the result of the Git Push & Pull API.
 */
export interface IGitPushPullResult {
  code: number;
  message?: string;
}

/**
 * Structure for the auth request.
 */
export interface authObject {
  username?: string;
  password?: string;
}

/**
 * Structure for the request to the Git Clone API.
 */
export interface cloneObject {
  current_path: string,
  clone_url: string;
  auth?: authObject;
}

/**
 * Structure for the request to the Git Push API.
 */
export interface pushObject {
  current_path: string;
  auth?: authObject;
}

/**
 * Structure for the request to the Git Pull API.
 */
export interface pullObject {
  current_path: string;
  auth?: authObject;
}

/**
 * Structure for the request to the Git Commit API.
 */
export interface commitObject {
  commit_msg: string;
  top_repo_path: string;
  author_name?: string;
  author_email?: string;
}

/** Parent class for all API requests */
export class Git {
  constructor() {}

  /** Make request for the Git Pull API. */
  async pull(path: string, auth: authObject = undefined): Promise<IGitPushPullResult> {
    try {
      if (auth) {
        var obj: pullObject = { 
          current_path: path,
          auth: auth
        };
      }
      else {
        var obj: pullObject = {
          current_path: path
        };
      }

      let response = await httpGitRequest('/git/pull', 'POST', obj);
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for the Git Push API. */
  async push(path: string, auth: authObject = undefined): Promise<IGitPushPullResult> {
    try {
      if (auth) {
        var obj: pushObject = { 
          current_path: path,
          auth: auth
        };
      }
      else {
        var obj: pushObject = {
          current_path: path
        };
      }
      let response = await httpGitRequest('/git/push', 'POST', obj);
      
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for the Git Clone API. */
  async clone(path: string, url: string, auth: authObject = undefined): Promise<GitCloneResult> {
    try {
      if (auth) {
        var obj: cloneObject = { 
          current_path: path,
          clone_url: url,
          auth: auth
        };
      }
      else {
        var obj: cloneObject = {
          current_path: path,
          clone_url: url
        };
      }

      let response = await httpGitRequest('/git/clone', 'POST', obj);
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for all git info of repository 'path'
   * (This API is also implicitly used to check if the current repo is a Git repo)
   */
  async allHistory(path: string): Promise<GitAllHistory> {
    try {
      let response = await httpGitRequest('/git/all_history', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.text();
        throw new ServerConnection.ResponseError(response, data);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for top level path of repository 'path' */
  async showTopLevel(path: string): Promise<GitShowTopLevelResult> {
    try {
      let response = await httpGitRequest('/git/show_top_level', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for the prefix path of a directory 'path',
   * with respect to the root directory of repository  */
  async showPrefix(path: string): Promise<GitShowPrefixResult> {
    try {
      let response = await httpGitRequest('/git/show_prefix', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for git status of repository 'path' */
  async status(path: string): Promise<GitStatusResult> {
    try {
      let response = await httpGitRequest('/git/status', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for git commit logs of repository 'path' */
  async log(path: string): Promise<GitLogResult> {
    try {
      let response = await httpGitRequest('/git/log', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for detailed git commit info of
   * commit 'hash' in repository 'path' */
  async detailedLog(
    hash: string,
    path: string
  ): Promise<SingleCommitFilePathInfo> {
    try {
      let response = await httpGitRequest('/git/detailed_log', 'POST', {
        selected_hash: hash,
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /** Make request for a list of all git branches in repository 'path' */
  async branch(path: string): Promise<GitBranchResult> {
    try {
      let response = await httpGitRequest('/git/branch', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to add one or all files into
   * the staging area in repository 'path' */
  async add(check: boolean, filename: string, path: string): Promise<Response> {
    return httpGitRequest('/git/add', 'POST', {
      add_all: check,
      filename: filename,
      top_repo_path: path
    });
  }

  /** Make request to add all untracked files into
   * the staging area in repository 'path' */
  async addAllUntracked(path: string): Promise<Response> {
    try {
      let response = await httpGitRequest('/git/add_all_untracked', 'POST', {
        top_repo_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to switch current working branch,
   * create new branch if needed,
   * or discard all changes,
   * or discard a specific file change
   * TODO: Refactor into seperate endpoints for each kind of checkout request */
  async checkout(
    checkout_branch: boolean,
    new_check: boolean,
    branchname: string,
    checkout_all: boolean,
    filename: string,
    path: string
  ): Promise<Response> {
    try {
      let response = await httpGitRequest('/git/checkout', 'POST', {
        checkout_branch: checkout_branch,
        new_check: new_check,
        branchname: branchname,
        checkout_all: checkout_all,
        filename: filename,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }
  /** Make request to commit all staged files in repository 'path' */
  async commit(message: string, path: string, authorName: string = '', authorEmail: string= ''): Promise<GitCommitResult> {
    try {
      if (authorName == '' && authorEmail == '') {
        var obj: commitObject = { 
          commit_msg: message, 
          top_repo_path: path
        };
      }
      else {
        var obj: commitObject = {
          commit_msg: message,
          top_repo_path: path,
          author_name: authorName,
          author_email: authorEmail
        };
      }
      let response = await httpGitRequest('/git/commit', 'POST', obj);
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to move one or all files from the staged to the unstaged area */
  async reset(
    check: boolean,
    filename: string,
    path: string
  ): Promise<Response> {
    try {
      let response = await httpGitRequest('/git/reset', 'POST', {
        reset_all: check,
        filename: filename,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to delete changes from selected commit */
  async deleteCommit(
    message: string,
    path: string,
    commitId: string
  ): Promise<Response> {
    try {
      let response = await httpGitRequest('/git/delete_commit', 'POST', {
        commit_id: commitId,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      await this.commit(message, path);
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to reset to selected commit */
  async resetToCommit(
    message: string,
    path: string,
    commitId: string
  ): Promise<Response> {
    try {
      let response = await httpGitRequest('/git/reset_to_commit', 'POST', {
        commit_id: commitId,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to initialize a  new git repository at path 'path' */
  async init(path: string): Promise<Response> {
    try {
      let response = await httpGitRequest('/git/init', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }
}
