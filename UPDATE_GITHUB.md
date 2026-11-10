# 🔄 How to Update GitHub Repository

Quick guide to push changes to your GitHub repository.

**Repository**: https://github.com/Thobatech31/2canplayscript

---

## ⚡ Quick Update Commands

When you make changes to the code, push them to GitHub:

```bash
# Navigate to project folder
cd /Users/mac/Documents/project_folder/2canplayscript

# Add all changed files
git add .

# Create a commit with a message
git commit -m "Updated documentation with GitHub links"

# Push to GitHub
git push
```

That's it! Your changes are now on GitHub.

---

## 📝 Current Updates to Push

You just created/updated these files:
- ✅ Updated README.md with GitHub link
- ✅ Updated INSTALLATION.md with GitHub link
- ✅ Created INSTALLATION_INSTRUCTIONS.md (easy guide for others)
- ✅ Created SHARE_WITH_FRIENDS.md (how to share with others)
- ✅ Created this file

### Push These Updates

```bash
cd /Users/mac/Documents/project_folder/2canplayscript

git add .
git commit -m "Added installation instructions and sharing guide with GitHub links"
git push
```

---

## 🎯 When to Push Updates

Push to GitHub whenever you:
- Fix bugs
- Add new features
- Update documentation
- Change settings or defaults
- Improve the code

---

## 📊 Check Your Repository

After pushing, verify updates on GitHub:
1. Visit https://github.com/Thobatech31/2canplayscript
2. Refresh the page
3. You should see:
   - Your latest commit message
   - Updated file timestamps
   - New files appear in file list

---

## 🔍 Check Repository Status

Before pushing, check what changed:

```bash
# See what files changed
git status

# See what changed in each file
git diff
```

---

## 🌿 Creating Releases

When you have a major update:

1. **Tag the version**
   ```bash
   git tag -a v1.0.1 -m "Version 1.0.1 - Updated documentation"
   git push origin v1.0.1
   ```

2. **Create Release on GitHub**
   - Go to https://github.com/Thobatech31/2canplayscript/releases
   - Click "Create a new release"
   - Select the tag (v1.0.1)
   - Add release notes
   - Publish

---

## 🆘 Common Issues

### "Nothing to commit"
You haven't made any changes. This is fine!

### "Permission denied"
You need to authenticate with GitHub. Use:
```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

### "Diverged branches"
Someone else made changes or you edited on GitHub directly. Pull first:
```bash
git pull
git push
```

---

## ✅ Verification Checklist

After pushing:

```
[ ] Ran git add .
[ ] Ran git commit with descriptive message
[ ] Ran git push
[ ] Visited GitHub to confirm changes appeared
[ ] Checked README.md displays correctly
[ ] Verified files are up to date
```

---

**Ready to push your updates!** 🚀
