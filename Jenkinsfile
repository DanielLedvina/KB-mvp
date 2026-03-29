pipeline {
    agent any

    environment {
        DOCKER_IMAGE_FRONTEND = 'tasker-frontend'
        DOCKER_IMAGE_BACKEND  = 'tasker-backend'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend') {
            steps {
                dir('tasker-frontend') {
                    sh 'npm ci'
                    sh 'npm test -- --run'
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
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker push ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG}'
                    sh 'docker push ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}'
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
