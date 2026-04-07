export const exportIdeasToCSV = (ideas, academicYearName) => {
    if (!ideas.length) return;
  
    const headers = [
      "Title",
      "Description",
      "Category",
      "Author",
      "Department",
      "Views",
      "Upvotes",
      "Downvotes",
      "Score",
      "Created At",
      "Comments Count",
      "Comment Content",
      "Comment Author"
    ];
  
    const rows = [];
  
    ideas.forEach((idea) => {
      const score = idea.upvotes.length - idea.downvotes.length;
  
      if (idea.comments.length === 0) {
        rows.push([
          idea.title,
          idea.description,
          idea.category,
          idea.isAnonymous ? "Anonymous" : idea.author.name,
          idea.author.department,
          idea.views,
          idea.upvotes.length,
          idea.downvotes.length,
          score,
          idea.createdAt,
          0,
          "",
          ""
        ]);
      } else {
        idea.comments.forEach((comment) => {
          rows.push([
            idea.title,
            idea.description,
            idea.category,
            idea.isAnonymous ? "Anonymous" : idea.author.name,
            idea.author.department,
            idea.views,
            idea.upvotes.length,
            idea.downvotes.length,
            score,
            idea.createdAt,
            idea.comments.length,
            comment.content,
            comment.author.name
          ]);
        });
      }
    });
  
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) => row.map((item) => `"${item}"`).join(","))
        .join("\n");
  
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ideas_${academicYearName}.csv`
    );
    document.body.appendChild(link);
    link.click();
  };