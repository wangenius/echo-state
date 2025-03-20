import { defineConfig } from "vitepress";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface SidebarItem {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
  order?: number;
}

// 生成工作流侧边栏
function generateWorkflowSidebar(dir: string): SidebarItem[] {
  const workflowsDir = path.join(__dirname, `../${dir}/tutorials`);

  function processDirectory(dirPath: string): SidebarItem[] {
    const items: SidebarItem[] = [];

    if (!fs.existsSync(dirPath)) {
      return items;
    }

    const files = fs.readdirSync(dirPath);

    // 首先处理目录
    files
      .filter((file) => {
        const fullPath = path.join(dirPath, file);
        return fs.statSync(fullPath).isDirectory();
      })
      .forEach((subdir) => {
        const fullPath = path.join(dirPath, subdir);
        const subItems = processDirectory(fullPath);
        if (subItems.length > 0) {
          items.push({
            text: subdir,
            collapsed: false,
            items: subItems,
            order: 999, // 目录默认排在最后
          });
        }
      });

    // 然后处理文件
    files
      .filter((file) => file.endsWith(".md"))
      .forEach((file) => {
        const fullPath = path.join(dirPath, file);
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const { data } = matter(content);

          const relativePath = path.relative(workflowsDir, fullPath);
          const link = `/${dir}/tutorials/${relativePath.replace(/\.md$/, "")}`;

          items.push({
            text: data.title || file.replace(".md", ""),
            link,
            collapsed: false,
            order: data.order ?? 100, // 如果没有指定order，默认为100
          });
        } catch (error) {
          console.error(`处理文件 ${file} 时出错:`, error);
        }
      });

    // 根据order和文件名排序
    return items.sort((a, b) => {
      // 首先按order排序
      if (a.order !== b.order) {
        return (a.order ?? 100) - (b.order ?? 100);
      }
      // order相同时按文件名排序
      return a.text.localeCompare(b.text);
    });
  }

  const sidebarItems = processDirectory(workflowsDir);

  return [
    {
      text: dir === "en" ? "Tutorials" : "教程",
      items: sidebarItems,
    },
  ];
}

// 生成API参考侧边栏
function generateApiSidebar(dir: string): SidebarItem[] {
  const apiDir = path.join(__dirname, `../${dir}/api`);

  function processDirectory(dirPath: string): SidebarItem[] {
    const items: SidebarItem[] = [];

    if (!fs.existsSync(dirPath)) {
      return items;
    }

    const files = fs.readdirSync(dirPath);

    // 处理文件
    files
      .filter((file) => file.endsWith(".md"))
      .forEach((file) => {
        const fullPath = path.join(dirPath, file);
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const { data } = matter(content);

          const relativePath = path.relative(apiDir, fullPath);
          const link = `/${dir}/api/${relativePath.replace(/\.md$/, "")}`;

          items.push({
            text: data.title || file.replace(".md", ""),
            link,
            collapsed: false,
            order: data.order ?? 100,
          });
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      });

    return items.sort((a, b) => {
      if (a.order !== b.order) {
        return (a.order ?? 100) - (b.order ?? 100);
      }
      return a.text.localeCompare(b.text);
    });
  }

  const sidebarItems = processDirectory(apiDir);

  return [
    {
      text: dir === "en" ? "API Reference" : "API参考",
      items: sidebarItems,
    },
  ];
}

export default defineConfig({
  title: "Echo",
  description: "Lightweight React State Management Library",
  base: "/echo-state/",
  head: [["link", { rel: "icon", href: "./icon.png" }]],
  cleanUrls: true,

  locales: {
    root: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      themeConfig: {
        nav: [
          { text: "Home", link: "/en/" },
          { text: "Tutorials", link: "/en/tutorials/echo" },
          { text: "API Reference", link: "/en/api/echo" },
        ],
        sidebar: {
          "/en/tutorials/": generateWorkflowSidebar("en"),
          "/en/api/": generateApiSidebar("en"),
        },
        langMenuLabel: "Switch Language",
        returnToTopLabel: "Return to Top",
        sidebarMenuLabel: "Menu",
        darkModeSwitchLabel: "Theme",
        outline: {
          label: "Outline",
        },
      },
    },

    zh: {
      label: "中文",
      lang: "zh-CN",
      link: "/zh/",
      themeConfig: {
        nav: [
          { text: "首页", link: "/zh/" },
          { text: "教程", link: "/zh/tutorials/echo" },
          { text: "API参考", link: "/zh/api/echo" },
        ],
        sidebar: {
          "/zh/tutorials/": generateWorkflowSidebar("zh"),
          "/zh/api/": generateApiSidebar("zh"),
        },
        langMenuLabel: "切换语言",
        returnToTopLabel: "返回顶部",
        sidebarMenuLabel: "菜单",
        darkModeSwitchLabel: "主题",
        outline: {
          label: "本页目录",
        },
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: "github", link: "https://github.com/wangenius/echo-state" },
    ],
  },
});
