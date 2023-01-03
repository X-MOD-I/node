const User = require('../schema/user.schema');

module.exports.getUsersWithPostCount = async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = +page;
  limit = +limit;
  try {
    const totalDocs = await User.count();
    const totalPages = Math.ceil(totalDocs / limit);

    const users = await User.aggregate([
      { $skip: limit * (page - 1) },
      { $limit: limit },
      { $project: { _id: 1, name: 1 } },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts',
        },
      },
      {
        $addFields: {
          posts: { $size: '$posts' },
        },
      },
    ]);

    res.status(200).json({
      data: {
        users: users,
        pagination: {
          totalDocs,
          limit,
          page,
          totalPages,
          pagingCounter: limit * (page - 1) + 1,
          hasPrevPage: page === 1 ? false : true,
          hasNextPage: page < totalPages ? true : false,
          prevPage: page === 1 ? null : page - 1,
          nextPage: page < totalPages ? page + 1 : null,
        },
      },
    });
  } catch (error) {
    res.send({ error: error.message });
  }
};
