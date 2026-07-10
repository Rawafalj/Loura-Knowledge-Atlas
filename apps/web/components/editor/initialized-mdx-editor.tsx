"use client";

import type { ForwardedRef } from "react";
import {
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";

export default function InitializedMdxEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  return (
    <MDXEditor
      {...props}
      ref={editorRef}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper options={["rich-text", "source"]}>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <CreateLink />
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
    />
  );
}
