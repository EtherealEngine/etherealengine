import { Button, MediumButton } from '../inputs/Button'
import { connectMenu, ContextMenu, MenuItem } from '../layout/ContextMenu'
import {
  ErrorMessage,
  ProjectGrid,
  ProjectGridContainer,
  ProjectGridContent,
  ProjectGridHeader,
  ProjectGridHeaderRow
} from './ProjectGrid'
import templates from './templates'
import { deleteScene, getScenes } from '../../functions/sceneFunctions'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { StyledProjectsContainer, StyledProjectsSection, WelcomeContainer } from '../../pages/projectUtility'
import { useAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import { getProjects } from '../../functions/projectFunctions'
import { CreateProjectModal } from './CreateProjectModal'
import { ProjectInterface } from '@xrengine/common/src/interfaces/ProjectInterface'
import { ProjectService } from '@xrengine/client-core/src/admin/services/ProjectService'
import { SceneService } from '@xrengine/client-core/src/admin/services/SceneService'

const contextMenuId = 'project-menu'

const ProjectsPage = () => {
  const router = useHistory()
  const [projects, setProjects] = useState([]) // constant projects initialized with an empty array.
  const [loading, setLoading] = useState(false) // constant loading initialized with false.
  const [error, setError] = useState(null) // constant error initialized with null.

  const authState = useAuthState()
  const authUser = authState.authUser // authUser initialized by getting property from authState object.
  const user = authState.user // user initialized by getting value from authState object.

  const { t } = useTranslation()
  const [createProjectsModalOpen, setCreateProjectsModalOpen] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const data = await getProjects()
      console.log(data)
      setProjects(data ?? [])
      setLoading(false)
    } catch (error) {
      console.error(error)
      if (error.response && error.response.status === 401) {
        // User has an invalid auth token. Prompt them to login again.
        // return (this.props as any).history.push("/", { from: "/projects" });
        return router.push('/editor')
      }
      setError(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (authUser?.accessToken.value != null && authUser.accessToken.value.length > 0 && user?.id.value != null) {
      fetchItems()
    }
  }, [authUser.accessToken.value])

  /**
   *function to delete project
   */
  const onDeleteProject = async (project) => {
    try {
      // TODO
    } catch (error) {
      console.log(`Error deleting project ${error}`)
    }
  }

  const openTutorial = () => {
    // router.push('/editor/tutorial')
  }

  /**
   *function to adding a route to the router object.
   */
  const onClickNew = () => {
    setCreateProjectsModalOpen(true)
  }

  const onClickExisting = (project) => {
    router.push(`/editor/${project.name}`)
  }

  const onCreateProject = async (name) => {
    console.log('onCreateProject', name)
    await ProjectService.createProject(name)
  }

  /**
   *function to render the ContextMenu component with MenuItem component delete.
   */
  const renderContextMenu = (props) => {
    return (
      <>
        <ContextMenu id={contextMenuId}>
          <MenuItem onClick={(e) => onDeleteProject(props.trigger.project)}>
            {t('editor.projects.contextMenu.deleteProject')}
          </MenuItem>
        </ContextMenu>
      </>
    )
  }

  /**
   *Calling a functional component connectMenu for creating ProjectContextMenu.
   *
   */
  const ProjectContextMenu = connectMenu(contextMenuId)(renderContextMenu)

  // Declaring an array
  const topTemplates = []

  // Adding first four templates of tamplates array to topTemplate array.
  for (let i = 0; i < templates.length && i < 4; i++) {
    topTemplates.push(templates[i])
  }

  /**
   * Rendering view for projects page, if user is not login yet then showing login view.
   * if user is loged in and has no existing projects then we showing welcome view, providing link for the tutorials.
   * if user has existing projects then we show the existing projects in grids and a grid to add new project.
   *
   */
  return (
    <>
      {authUser?.accessToken.value != null && authUser.accessToken.value.length > 0 && user?.id.value != null && (
        <main>
          {projects.length < 2 && !loading ? (
            <StyledProjectsSection flex={0}>
              <WelcomeContainer>
                <h1>{t('editor.projects.welcomeMsg')}</h1>
                <h2>{t('editor.projects.description')}</h2>
                <MediumButton onClick={openTutorial}>{t('editor.projects.lbl-startTutorial')}</MediumButton>
              </WelcomeContainer>
            </StyledProjectsSection>
          ) : null}
          <StyledProjectsSection>
            <StyledProjectsContainer>
              <ProjectGridContainer>
                <ProjectGridHeader>
                  <ProjectGridHeaderRow />
                  <ProjectGridHeaderRow>
                    <Button onClick={onClickNew}>{t(`editor.projects.lbl-newProject`)}</Button>
                  </ProjectGridHeaderRow>
                </ProjectGridHeader>
                <ProjectGridContent>
                  {error && <ErrorMessage>{(error as any).message}</ErrorMessage>}
                  {!error && (
                    <ProjectGrid
                      loading={loading}
                      projects={projects}
                      onClickExisting={onClickExisting}
                      onClickNew={onClickNew}
                      newProjectLabel={t(`editor.projects.lbl-newProject`)}
                      contextMenuId={contextMenuId}
                    />
                  )}
                </ProjectGridContent>
              </ProjectGridContainer>
            </StyledProjectsContainer>
          </StyledProjectsSection>
          <ProjectContextMenu />
          <CreateProjectModal
            createProject={onCreateProject}
            open={createProjectsModalOpen}
            handleClose={() => setCreateProjectsModalOpen(false)}
          />
        </main>
      )}
    </>
  )
}

export default ProjectsPage
