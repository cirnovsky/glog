# GLog - GitHub Discussions Blog

A modern blog platform that uses GitHub Discussions as a content management system. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Fetches blog posts from GitHub Discussions
- Renders GitHub-flavored markdown content
- Responsive and modern design
- SEO-friendly
- Type-safe with TypeScript

## Prerequisites

- Node.js 18+ and npm
- A GitHub account
- A GitHub repository with Discussions enabled
- A GitHub Personal Access Token with `repo` scope

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/cirnovsky/glog.git
   cd glog
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   GITHUB_TOKEN=your_github_token
   REPO_OWNER=your_github_username
   REPO_NAME=your_repo_name
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Create a new discussion in your GitHub repository's Discussions tab
2. Write your blog post using GitHub-flavored markdown
3. The post will automatically appear on your blog

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT