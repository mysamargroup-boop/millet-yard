"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, PlusCircle, Search, FileText, Calendar, User, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteBlogPostAction } from "@/lib/actions";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import type { BlogPost } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BlogsClient({ posts }: { posts: BlogPost[] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    if (!q) return posts;
    const qq = q.toLowerCase();
    return posts.filter(p =>
      p.title.toLowerCase().includes(qq) ||
      p.slug.toLowerCase().includes(qq) ||
      p.author.toLowerCase().includes(qq)
    );
  }, [posts, q]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#137fec]" />
            Blog Posts
          </h1>
          <p className="text-muted-foreground text-sm">Manage your blog content and articles</p>
        </div>
        <Button asChild className="bg-[#137fec] hover:bg-[#0d6edb] text-white">
          <Link href="/sr-admin/blogs/new"><PlusCircle className="mr-2 h-4 w-4" /> Create New Post</Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts by title, author, or slug..."
            className="pl-10 glass-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Content Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-white/5 bg-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-24 text-xs uppercase font-semibold text-muted-foreground">Cover</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground">Title & Slug</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground">Author</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground">Date</TableHead>
                <TableHead className="w-20 text-right text-xs uppercase font-semibold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {q ? 'No posts matching your search.' : 'No blog posts found. Create one to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((post) => (
                  <TableRow key={post.slug} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell>
                      <div className="h-12 w-16 relative rounded-md overflow-hidden bg-muted/20">
                        {post.imageUrl ? (
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <FileText className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm line-clamp-1 group-hover:text-[#137fec] transition-colors">{post.title}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5 max-w-[200px] truncate">/{post.slug}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {post.author}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel border-white/10">
                          <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-[#137fec]">
                            <Link href={`/sr-admin/blogs/${post.slug}/edit`} className="flex items-center cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit Post
                            </Link>
                          </DropdownMenuItem>
                          <form action={deleteBlogPostAction.bind(null, post.slug)}>
                            <DropdownMenuItem asChild className="focus:bg-red-500/10 focus:text-red-500">
                              <button type="submit" className="w-full flex items-center text-left text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                              </button>
                            </DropdownMenuItem>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
