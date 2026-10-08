# Publishing the ZHUDDLE intro video

[← Back to the README](../README.md)

## What is connected now

The README’s **Watch the intro** link jumps to a clickable poster. Both the poster and its text link open [`media/zhuddle-intro.mp4`](media/zhuddle-intro.mp4), the supplied video (about 4.9 MB). The file is kept under `docs/`, so it does not add to the deployed app’s page load. Depending on GitHub and browser support, visitors can play the file or download it.

The four supplied PNGs are preserved unchanged in `docs/media/`. They are promotional illustrations, labeled as such in the README, rather than exact screenshots of the current app.

At the time of this update, `PCTEJA/zhuddle-python` is **private**. Its README and repository-hosted video require repository access. Changing repository visibility is a separate owner decision; the live app at [zhuddle.com](https://zhuddle.com/) can be shared independently.

## Recommended public placement: YouTube + a linked README poster

For a video intended to attract new learners, upload it to YouTube and keep the visual preview in the README. This gives viewers a familiar player and a shareable destination without putting a larger video into Git history.

1. Open [YouTube Studio](https://studio.youtube.com/) and choose **Create → Upload videos**.
2. Upload your original `zhuddle_video.mp4`.
3. Use a clear title, such as **ZHUDDLE | Learn Python, One Small Win at a Time**.
4. Begin the description with `Try ZHUDDLE: https://zhuddle.com/`, then describe the browser-based missions, feedback, and chapter downloads. Complete the audience and other required settings accurately.
5. Choose **Public** if you want the video discoverable on YouTube, or **Unlisted** if you only want to distribute its link. Anyone with an unlisted link can watch and reshare it; private videos are unsuitable for an unrestricted README link.
6. Copy the video’s share URL.
7. In `README.md`, find `<!-- VIDEO_LINK:` and replace **both** `href="docs/media/zhuddle-intro.mp4"` destinations with that URL. Keep the poster’s image source unchanged.
8. Change the link text to **▶ Watch the intro on YouTube** and the small caption to **Opens on YouTube.** The top navigation already points to this section, so it needs no change.
9. Check the link in a signed-out browser before sharing it publicly.

The preview belongs in the README’s **See ZHUDDLE in action** section, with a direct navigation link near the top. A linked image uses ordinary Markdown/HTML links and works without a YouTube iframe or autoplay.

For a shorter README, the same video link can also be placed on the top brand image. Keep a separate **Start learning** link to the app.

## GitHub-hosted alternative

GitHub supports video attachments in supported Markdown editing fields. If you prefer a GitHub-hosted attachment, upload the MP4 through a supported editor, wait for the generated attachment URL, and use that URL in the README. Preview it before committing; do not guess an attachment URL or assume that any repository MP4 path becomes an inline player.

The current repository-file link is already usable and needs no separate video-hosting account. Keeping future large video versions on YouTube or as attachments avoids repeatedly growing the Git checkout.

## References

- [YouTube: upload videos](https://support.google.com/youtube/answer/57407)
- [YouTube: public, private, and unlisted visibility](https://support.google.com/youtube/answer/157177)
- [GitHub: attaching files, formats, and size limits](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
- [GitHub: README images and relative links](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
