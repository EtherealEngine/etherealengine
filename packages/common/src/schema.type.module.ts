/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

export type * from './schemas/analytics/analytics.schema'
export type * from './schemas/assets/asset-library.schema'
export type * from './schemas/assets/model-transform.schema'
export type * from './schemas/bot/bot-command.schema'
export type * from './schemas/bot/bot.schema'
export type * from './schemas/cluster/api-job.schema'
export type * from './schemas/cluster/build-status.schema'
export type * from './schemas/cluster/logs-api.schema'
export type * from './schemas/cluster/pods.schema'
export type * from './schemas/matchmaking/match-instance.schema'
export type * from './schemas/matchmaking/match-user.schema'
export type * from './schemas/media/archiver.schema'
export type * from './schemas/media/file-browser-upload.schema'
export type * from './schemas/media/file-browser.schema'
export type * from './schemas/media/oembed.schema'
export type * from './schemas/media/static-resource-filters.schema'
export type * from './schemas/media/static-resource.schema'
export type * from './schemas/networking/instance-active.schema'
export type * from './schemas/networking/instance-attendance.schema'
export type * from './schemas/networking/instance-authorized-user.schema'
export type * from './schemas/networking/instance-friends.schema'
export type * from './schemas/networking/instance-provision.schema'
export type * from './schemas/networking/instance.schema'
export type * from './schemas/projects/builder-info.schema'
export type * from './schemas/projects/portal.schema'
export type * from './schemas/projects/project-branches.schema'
export type * from './schemas/projects/project-build.schema'
export type * from './schemas/projects/project-builder-tags.schema'
export type * from './schemas/projects/project-check-source-destination-match.schema'
export type * from './schemas/projects/project-check-unfetched-commit.schema'
export type * from './schemas/projects/project-commits.schema'
export type * from './schemas/projects/project-destination-check.schema'
export type * from './schemas/projects/project-github-push.schema'
export type * from './schemas/projects/project-invalidate.schema'
export type * from './schemas/projects/project-permission-type.schema'
export type * from './schemas/projects/project-permission.schema'
export type * from './schemas/projects/project.schema'
export type * from './schemas/projects/projects.schema'
export type * from './schemas/projects/scene-data.schema'
export type * from './schemas/projects/scene-upload.schema'
export type * from './schemas/projects/scene.schema'
export type * from './schemas/recording/recording-resource-upload.schema'
export type * from './schemas/recording/recording-resource.schema'
export type * from './schemas/recording/recording.schema'
export type * from './schemas/route/route.schema'
export type * from './schemas/scope/scope-type.schema'
export type * from './schemas/scope/scope.schema'
export type * from './schemas/setting/authentication-setting.schema'
export type * from './schemas/setting/aws-setting.schema'
export type * from './schemas/setting/chargebee-setting.schema'
export type * from './schemas/setting/client-setting.schema'
export type * from './schemas/setting/coil-setting.schema'
export type * from './schemas/setting/email-setting.schema'
export type * from './schemas/setting/helm-setting.schema'
export type * from './schemas/setting/instance-server-setting.schema'
export type * from './schemas/setting/redis-setting.schema'
export type * from './schemas/setting/server-setting.schema'
export type * from './schemas/setting/task-server-setting.schema'
export type * from './schemas/social/channel-user.schema'
export type * from './schemas/social/channel.schema'
export type * from './schemas/social/invite-code-lookup.schema'
export type * from './schemas/social/invite-type.schema'
export type * from './schemas/social/invite.schema'
export type * from './schemas/social/location-admin.schema'
export type * from './schemas/social/location-authorized-user.schema'
export type * from './schemas/social/location-ban.schema'
export type * from './schemas/social/location-setting.schema'
export type * from './schemas/social/location-type.schema'
export type * from './schemas/social/location.schema'
export type * from './schemas/social/message.schema'
export type * from './schemas/user/accept-invite.schema'
export type * from './schemas/user/avatar.schema'
export type * from './schemas/user/discord-bot-auth.schema'
export type * from './schemas/user/email.schema'
export type * from './schemas/user/generate-token.schema'
export type * from './schemas/user/github-repo-access-refresh.schema'
export type * from './schemas/user/github-repo-access-webhook.schema'
export type * from './schemas/user/github-repo-access.schema'
export type * from './schemas/user/identity-provider.schema'
export type * from './schemas/user/login-token.schema'
export type * from './schemas/user/login.schema'
export type * from './schemas/user/magic-link.schema'
export type * from './schemas/user/sms.schema'
export type * from './schemas/user/user-api-key.schema'
export type * from './schemas/user/user-avatar.schema'
export type * from './schemas/user/user-kick.schema'
export type * from './schemas/user/user-relationship-type.schema'
export type * from './schemas/user/user-relationship.schema'
export type * from './schemas/user/user-setting.schema'
export type * from './schemas/user/user.schema'
export const locationPath = 'location'

export const userRelationshipPath = 'user-relationship'

export const githubRepoAccessPath = 'github-repo-access'

export const discordBotAuthPath = 'discord-bot-auth'

export const emailPath = 'email'

export const loginTokenPath = 'login-token'

export const githubRepoAccessWebhookPath = 'github-repo-access-webhook'

export const githubRepoAccessRefreshPath = 'github-repo-access-refresh'

export const userApiKeyPath = 'user-api-key'

export const userRelationshipTypePath = 'user-relationship-type'

export const generateTokenPath = 'generate-token'

export const identityProviderPath = 'identity-provider'

export const smsPath = 'sms'

export const avatarPath = 'avatar'

export const magicLinkPath = 'magic-link'

export const userKickPath = 'user-kick'

export const userSettingPath = 'user-setting'

export const userAvatarPath = 'user-avatar'

export const loginPath = 'login'

export const userPath = 'user'

export const acceptInvitePath = 'accept-invite'

export const messagePath = 'message'

export const locationAuthorizedUserPath = 'location-authorized-user'

export const channelUserPath = 'channel-user'

export const inviteCodeLookupPath = 'invite-code-lookup'

export const inviteTypePath = 'invite-type'

export const invitePath = 'invite'

export const locationTypePath = 'location-type'

export const locationAdminPath = 'location-admin'

export const channelPath = 'channel'

export const locationBanPath = 'location-ban'

export const locationSettingPath = 'location-setting'

export const assetLibraryPath = 'asset-library'

export const modelTransformPath = 'model-transform'

export const recordingResourcePath = 'recording-resource'

export const recordingPath = 'recording'

export const recordingResourceUploadPath = 'recording-resource-upload'

export const instanceAttendancePath = 'instance-attendance'

export const fileBrowserPath = 'file-browser'

export const fileBrowserUploadPath = 'file-browser-upload'

export const staticResourcePath = 'static-resource'

export const oembedPath = 'oembed'

export const instanceActivePath = 'instance-active'

export const staticResourceFiltersPath = 'static-resource-filters'

export const archiverPath = 'archiver'

export const instanceProvisionPath = 'instance-provision'

export const instanceAuthorizedUserPath = 'instance-authorized-user'

export const instancePath = 'instance'

export const instanceFriendsPath = 'instance-friends'

export const routePath = 'route'

export const helmMainVersionPath = 'helm-main-version'
export const helmBuilderVersionPath = 'helm-builder-version'

export const coilSettingPath = 'coil-setting'

export const awsSettingPath = 'aws-setting'

export const taskServerSettingPath = 'task-server-setting'

export const emailSettingPath = 'email-setting'

export const instanceServerSettingPath = 'instance-server-setting'

export const clientSettingPath = 'client-setting'

export const redisSettingPath = 'redis-setting'

export const chargebeeSettingPath = 'chargebee-setting'

export const matchUserPath = 'match-user'

export const matchInstancePath = 'match-instance'

export const authenticationSettingPath = 'authentication-setting'

export const analyticsPath = 'analytics'

export const serverSettingPath = 'server-setting'

export const scopeTypePath = 'scope-type'

export const scopePath = 'scope'

export const projectPermissionPath = 'project-permission'

export const projectBranchesPath = 'project-branches'

export const projectBuildPath = 'project-build'

export const projectInvalidatePath = 'project-invalidate'

export const projectPath = 'project'

export const projectsPath = 'projects'

export const scenePath = 'scene'

export const builderInfoPath = 'builder-info'

export const projectCheckSourceDestinationMatchPath = 'project-check-source-destination-match'

export const botPath = 'bot'

export const botCommandPath = 'bot-command'

export const projectPermissionTypePath = 'project-permission-type'

export const projectDestinationCheckPath = 'project-destination-check'

export const sceneDataPath = 'scene-data'

export const portalPath = 'portal'

export const projectCheckUnfetchedCommitPath = 'project-check-unfetched-commit'

export const projectBuilderTagsPath = 'project-builder-tags'

export const sceneUploadPath = 'scene-upload'

export const logsApiPath = 'logs-api'

export const projectGithubPushPath = 'project-github-push'

export const projectCommitsPath = 'project-commits'

export const podsPath = 'pods'

export const buildStatusPath = 'build-status'
export const helmSettingPath = 'helm-setting'
export const apiJobPath = 'api-job'

export const uploadAssetPath = 'upload-asset'
