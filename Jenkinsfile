pipeline {
    agent any

    environment {
        DOCKER_IMAGE_FRONTEND = 'tasker-frontend'
        DOCKER_IMAGE_BACKEND  = 'tasker-backend'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Check commit') {
            steps {
                script {
                    def msg = sh(script: 'git log -1 --pretty=%s', returnStdout: true).trim()
                    if (msg.startsWith('ci: update image tags')) {
                        currentBuild.result = 'NOT_BUILT'
                        error('Skipping CI commit')
                    }
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend') {
            steps {
                dir('tasker-frontend') {
                    sh 'npm ci'
                    sh 'npm run test:ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend') {
            steps {
                dir('tasker-backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} ./tasker-frontend'
                sh 'docker build -t ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}  ./tasker-backend'
            }
        }

        stage('Docker Push') {
            when {
                expression {
                    return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main'
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker tag ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} ${DOCKER_USER}/${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG}'
                    sh 'docker tag ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}  ${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}'
                    sh 'docker tag ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} ${DOCKER_USER}/${DOCKER_IMAGE_FRONTEND}:latest'
                    sh 'docker tag ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}  ${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:latest'
                    sh 'docker push ${DOCKER_USER}/${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG}'
                    sh 'docker push ${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}'
                    sh 'docker push ${DOCKER_USER}/${DOCKER_IMAGE_FRONTEND}:latest'
                    sh 'docker push ${DOCKER_USER}/${DOCKER_IMAGE_BACKEND}:latest'
                }
            }
        }

        stage('Update Manifests') {
            when {
                expression {
                    return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main'
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-credentials',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_PASS'
                )]) {
                    sh "sed -i 's|danielledvina/tasker-frontend:.*|danielledvina/tasker-frontend:${DOCKER_TAG}|' k8s/frontend.yaml"
                    sh "sed -i 's|danielledvina/tasker-backend:.*|danielledvina/tasker-backend:${DOCKER_TAG}|' k8s/backend.yaml"
                    sh 'git config user.email "jenkins@tasker.com"'
                    sh 'git config user.name "Jenkins"'
                    sh 'git add k8s/frontend.yaml k8s/backend.yaml'
                    sh "git commit -m 'ci: update image tags to ${DOCKER_TAG}'"
                    sh 'git push https://${GIT_USER}:${GIT_PASS}@github.com/DanielLedvina/KB-mvp.git HEAD:main'
                }
            }
        }

    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} succeeded."
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} failed."
        }
    }
}
