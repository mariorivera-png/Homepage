const tableHTML = `
      <table class="lst">
        <thead>
          <tr>
            <th>Bang</th>
            <th>URL Template</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(bangs)
            .map(
              ([cmd, url]) => `
            <tr>
              <td><strong>${cmd}</strong></td>
              <td><code>${url}</code></td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;

document.getElementById("lst").innerHTML = tableHTML;
