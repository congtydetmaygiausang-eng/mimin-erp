git add apps/web/src/app/(main)/ke-hoach-san-xuat/page.tsx apps/web/src/components/danh-muc-sp/ProductDetailModal.tsx apps/web/src/components/danh-muc-sp/ProductLibraryCard.tsx
git commit -m "fix(ui): repair jsx corruption from pr83"
git push -u origin fix/repair-pr83-jsx
gh pr create --title "fix(ui): repair jsx corruption from pr83" --body "Repaired JSX fragments, missing closing tags and missing destructurings in PR 83" --base main
